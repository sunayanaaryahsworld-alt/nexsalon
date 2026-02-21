import { db } from "../config/firebase.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  updatePassword,
} from "firebase/auth";
import { ref, get, update } from "firebase/database";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { storage } from "../config/firebase.js";
import bcrypt from "bcrypt";

export const getProfile = async (req, res) => {
    try {
        const { uid, role, email } = req.user;

        if (!uid || !role) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized access",
            });
        }

        if (role === "admin") {
            const adminRef = ref(db, `salonandspa/admin/${uid}`);
            const adminSnap = await get(adminRef);

            if (!adminSnap.exists()) {
                return res.status(404).json({
                    success: false,
                    message: "Admin profile not found",
                });
            }

            const adminData = adminSnap.val();

            /* ================= FETCH SALON DETAILS ================= */
            const salonEntries = Object.keys(adminData)
                .filter((key) => key.startsWith("salonid"))
                .map((key) => adminData[key])
                .filter(Boolean); // ✅ safety

            const salons = [];

            for (const salonId of salonEntries) {
                const salonRef = ref(db, `salonandspa/salons/${salonId}`);
                const salonSnap = await get(salonRef);

                if (salonSnap.exists()) {
                    const salonData = salonSnap.val();
                    salons.push({
                        id: salonId,
                        name: salonData.name ?? "Unnamed Salon",
                        city: salonData.city ?? "",
                        address: salonData.address ?? "",
                    });
                }
            }

            /* ================= FETCH SPA DETAILS ================= */
            const spaEntries = Object.keys(adminData)
                .filter((key) => key.startsWith("spaid"))
                .map((key) => adminData[key])
                .filter(Boolean);

            const spas = [];

            for (const spaId of spaEntries) {
                const spaRef = ref(db, `salonandspa/spas/${spaId}`);
                const spaSnap = await get(spaRef);

                if (spaSnap.exists()) {
                    const spaData = spaSnap.val();
                    spas.push({
                        id: spaId,
                        name: spaData.name ?? "Unnamed Spa",
                        city: spaData.city ?? "",
                    });
                }
            }

            /* ================= FINAL RESPONSE ================= */
            return res.status(200).json({
                success: true,
                data: {
                    header: {
                        name: adminData.name ?? "",
                        role: "Admin",
                        email: adminData.email ?? email ?? "",
                        status: adminData.subscription?.status ?? "inactive",
                    },

                    personalInformation: {
                        uid: adminData.uid ?? uid,
                        name: adminData.name ?? "",
                        email: adminData.email ?? email ?? "",
                        phone: adminData.phone ?? null,
                        role: adminData.role ?? "admin",
                    },

                    businessInformation: {
                        // ✅ FIX: count always matches list
                        salonCount: salons.length,
                        spaCount: spas.length,
                        salons,
                        spas,
                    },

                    accountDetails: {
                        role: adminData.role ?? "admin",
                        subscription: adminData.subscription ?? {},
                        createdAt: adminData.createdAt ?? null,
                        updatedAt: adminData.updatedAt ?? null,
                    },

                    rawData: adminData, // untouched
                },
            });
        }

        return res.status(403).json({
            success: false,
            message: "Role not supported",
        });

    } catch (error) {
        console.error("Profile Controller Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};




export const getReceptionistProfile = async (req, res) => {
    try {
        const { uid, role } = req.user;
        const { employeeUid } = req.params;

        // ✅ Allow ADMIN & EMPLOYEE
        if (!["admin", "employee"].includes(role)) {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }

        // ✅ Employee can view ONLY own profile
        if (role === "employee" && uid !== employeeUid) {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }

        const empRef = ref(db, `salonandspa/employees/${employeeUid}`);
        const empSnap = await get(empRef);

        if (!empSnap.exists()) {
            return res.status(404).json({
                success: false,
                message: "Receptionist profile not found"
            });
        }

        const empData = empSnap.val();

        let assignedSalon = null;
        if (empData.salonid1) {
            const salonSnap = await get(
                ref(db, `salonandspa/salons/${empData.salonid1}`)
            );

            if (salonSnap.exists()) {
                const s = salonSnap.val();
                assignedSalon = {
                    id: empData.salonid1,
                    name: s.name ?? "",
                    address: s.address ?? "",
                    city: s.city ?? ""
                };
            }
        }

        return res.status(200).json({
            success: true,
            data: {
                header: {
                    name: empData.name,
                    role: "Receptionist",
                    email: empData.email ?? "",
                    status: empData.isActive ? "active" : "inactive"
                },
                personalInformation: {
                    uid: employeeUid,
                    name: empData.name,
                    phone: empData.phone ?? null,
                    role: empData.role
                },
                businessInformation: {
                    assignedSalon,
                    shift: empData.shift ?? ""
                },
                accountDetails: {
                    role: empData.role,
                    createdAt: empData.createdAt ?? null,
                    updatedAt: empData.updatedAt ?? null
                },
                rawData: empData
            }
        });

    } catch (error) {
        console.error("Receptionist Profile Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};



export const updateReceptionistProfile = async (req, res) => {
    try {
        /* ================= AUTH SAFETY ================= */
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const { uid, role } = req.user;
        const { employeeUid } = req.params;
        const { name, email, phone } = req.body;

        /* ================= ROLE CHECK ================= */
        if (!["admin", "employee"].includes(role)) {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }

        /* ================= SELF UPDATE CHECK ================= */
        if (role === "employee" && uid !== employeeUid) {
            return res.status(403).json({
                success: false,
                message: "You can update only your own profile"
            });
        }

        if (!employeeUid) {
            return res.status(400).json({
                success: false,
                message: "Employee UID is required"
            });
        }

        /* ================= FIREBASE CHECK ================= */
        const empRef = ref(db, `salonandspa/employees/${employeeUid}`);
        const empSnap = await get(empRef);

        if (!empSnap.exists()) {
            return res.status(404).json({
                success: false,
                message: "Receptionist not found"
            });
        }

        /* ================= UPDATE PAYLOAD ================= */
        const updates = {
            updatedAt: Date.now()
        };

        if (typeof name === "string" && name.trim()) {
            updates.name = name.trim();
        }

        if (typeof email === "string" && email.trim()) {
            updates.email = email.trim();
        }

        if (typeof phone === "string" && phone.trim()) {
            updates.phone = phone.trim();
        }

        if (Object.keys(updates).length === 1) {
            return res.status(400).json({
                success: false,
                message: "No valid fields to update"
            });
        }

        await update(empRef, updates);

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully"
        });

    } catch (error) {
        console.error("Update Receptionist Profile Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};



export const updateOwnerAccount = async (req, res) => {
    try {
        const uid = req.user?.uid || req.userId;

        if (!uid) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: user id missing",
            });
        }

        const { name, phone } = req.body;

        if (!name || !phone) {
            return res.status(400).json({
                success: false,
                message: "Name and phone are required",
            });
        }

        const userRef = ref(db, `salonandspa/admin/${uid}`);
        const snapshot = await get(userRef);

        if (!snapshot.exists()) {
            return res.status(404).json({
                success: false,
                message: "Admin profile not found",
            });
        }

        const existingData = snapshot.val();
        const updatedData = {
            name,
            phone,
            updatedAt: Date.now(),
        };

        // 📸 Handle Photo Update
        if (req.file) {
            // Delete old photo if exists
            if (existingData.ownerPhotoPath) {
                try {
                    await deleteObject(storageRef(storage, existingData.ownerPhotoPath));
                } catch (e) {
                    console.warn("OLD OWNER PHOTO DELETE FAILED:", e.message);
                }
            }

            const ext = req.file.originalname.split(".").pop();
            const filePath = `salonandspa/admin/${uid}/owner-photo-${Date.now()}.${ext}`;
            const imgRef = storageRef(storage, filePath);

            await uploadBytes(imgRef, req.file.buffer, {
                contentType: req.file.mimetype,
            });

            const downloadURL = await getDownloadURL(imgRef);
            updatedData.ownerPhoto = downloadURL;
            updatedData.ownerPhotoPath = filePath;
        }

        await update(userRef, updatedData);

        return res.status(200).json({
            success: true,
            message: "Owner account updated successfully",
            data: {
                uid,
                name,
                phone,
                email: existingData.email,
                role: existingData.role,
                ownerPhoto: updatedData.ownerPhoto || existingData.ownerPhoto || existingData.profilePhoto || null,
                updatedAt: updatedData.updatedAt,
            },
        });
    } catch (error) {
        console.error("❌ updateOwnerAccount error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


export const updateSalonProfile = async (req, res) => {
    try {
        const { salonId } = req.params;
        const { name, email, phone, website, address, logo } = req.body;

        if (!salonId) {
            return res.status(400).json({
                success: false,
                message: "Salon ID is required",
            });
        }

        if (!name || !phone) {
            return res.status(400).json({
                success: false,
                message: "Salon name and phone are required",
            });
        }

        const salonRef = ref(db, `salonandspa/salons/${salonId}`);
        const snapshot = await get(salonRef);

        if (!snapshot.exists()) {
            return res.status(404).json({
                success: false,
                message: "Salon not found",
            });
        }

        const updatedData = {
            name,
            email: email || "",
            phone,
            website: website || "",
            address: address || "",
            updatedAt: Date.now(),
        };

        if (logo) {
            updatedData.logo = logo;
        }

        await update(salonRef, updatedData);

        return res.status(200).json({
            success: true,
            message: "Salon profile updated successfully",
            data: updatedData,
        });
    } catch (error) {
        console.error("❌ updateSalonProfile error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};



export const changeOwnerPassword = async (req, res) => {
  try {
    const uid = req.user?.uid || req.userId;
    const { currentPassword, newPassword } = req.body;

    if (!uid) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters",
      });
    }

    // 🔹 1. Get user from DB
    const userRef = ref(db, `salonandspa/admin/${uid}`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const userData = snapshot.val();

    // 🔹 2. Verify current password
    const isMatch = await bcrypt.compare(
      currentPassword,
      userData.password
    );

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // 🔹 3. Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // 🔹 4. Update password
    await update(userRef, {
      password: hashedPassword,
      updatedAt: Date.now(),
    });

    return res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("❌ changeOwnerPassword error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update password",
    });
  }
};




export const logoutOwnerFromAllDevices = async (req, res) => {
  try {
    const uid = req.user?.uid || req.userId;

    if (!uid) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const userRef = ref(db, `salonandspa/admin/${uid}`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const userData = snapshot.val();
    const currentTokenVersion = userData.tokenVersion || 0;

    // 🔥 Increment tokenVersion → invalidates all old tokens
    await update(userRef, {
      tokenVersion: currentTokenVersion + 1,
      updatedAt: Date.now(),
    });

    return res.status(200).json({
      success: true,
      message: "Logged out from all devices successfully",
    });
  } catch (error) {
    console.error("❌ logoutOwnerFromAllDevices error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to logout from all devices",
    });
  }
};
