import { db } from "../config/firebase.js";
import { ref, get } from "firebase/database";

export const getOwnerReports = async (req, res) => {
  try {
    const { salonId, month, year, week } = req.query;
    const selectedWeek = Number(week) || 1;
    if (!salonId || !month || !year) {
      return res.status(400).json({
        success: false,
        message: "salonId, month and year are required",
      });
    }

    const snapshot = await get(
      ref(db, `salonandspa/appointments/salon/${salonId}`)
    );

    // ✅ FETCH SERVICES MASTER DATA
    const servicesSnapshot = await get(
      ref(db, `salonandspa/salons/${salonId}/services`)
    );
    const servicesMaster = servicesSnapshot.exists() ? servicesSnapshot.val() : {};

    const appointments = snapshot.exists() ? snapshot.val() : {};

    // --- INIT REPORT VARS ---
    let grossRevenue = 0;
    let totalBookings = 0;

    const weeklyRevenue = Array(5).fill(0); // faster charts
    const monthlyRevenue = Array(12).fill(0); // ⭐ NEW
    const categoryRevenue = {};


    // Daily Chart Data Init
    const daysInMonth = new Date(year, month, 0).getDate();
    // ✅ WEEK RANGE
    const startOfMonth = new Date(year, month - 1, 1, 0, 0, 0, 0);

    const startOfWeek =
      new Date(startOfMonth.getTime() + (selectedWeek - 1) * 7 * 86400000);

    const endOfWeek =
      new Date(startOfWeek.getTime() + 7 * 86400000);

    // always fixed length
    const dailyChartData = Array(7).fill(0);


    // --- INIT DASHBOARD STATS VARS ---
    const now = new Date();
    // Helper to clear time
    const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };

    const todayStr = startOfDay(now).toDateString();
    const yesterdayStr = startOfDay(new Date(Date.now() - 864e5)).toDateString();

    // Last Month (for trend comparison)
    // If filter month is M, Last Month is M-1. 
    // Note: 'month' param is 1-indexed (1=Jan).
    const currentMonthNum = Number(month);
    const currentYearNum = Number(year);
    const lastMonthNum = currentMonthNum === 1 ? 12 : currentMonthNum - 1;
    const lastMonthYear = currentMonthNum === 1 ? currentYearNum - 1 : currentYearNum;

    // Week boundaries for Client Count
    // Current Week
    const currKey = now.getDate() - now.getDay(); // Sunday
    const thisWeekStart = new Date(now); thisWeekStart.setDate(currKey); thisWeekStart.setHours(0, 0, 0, 0);
    const thisWeekEnd = new Date(thisWeekStart); thisWeekEnd.setDate(thisWeekStart.getDate() + 6); thisWeekEnd.setHours(23, 59, 59, 999);

    // Last Week (for trend)
    const lastWeekStart = new Date(thisWeekStart); lastWeekStart.setDate(thisWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(lastWeekStart); lastWeekEnd.setDate(lastWeekStart.getDate() + 6); lastWeekEnd.setHours(23, 59, 59, 999);

    let stats = {
      todayAppts: 0, todayRev: 0,
      yesterdayAppts: 0, yesterdayRev: 0,
      lastMonthRev: 0,
      weekClients: new Set(),
      lastWeekClients: new Set()
    };

    Object.values(appointments).forEach((appt) => {
      if (!appt) return;

      const status = appt.status ? appt.status.toLowerCase() : "";
      const valid = status === "booked" || status === "confirmed";
      const paid = appt.paymentStatus === "paid";

      const rawDate = appt.date;
      let dateObj;

      if (!rawDate) return;
      if (rawDate.includes("-") && rawDate.split("-")[0].length === 2) {
        const [d, m, y] = rawDate.split("-");

        dateObj = new Date(
          Number(y),
          Number(m) - 1,
          Number(d)
        );
      } else if (typeof rawDate === "string") {
        if (rawDate.includes("-") && rawDate.split("-")[0].length === 2) {
          const [d, m, y] = rawDate.split("-");
          dateObj = new Date(`${y}-${m}-${d}`);
        } else {
          dateObj = new Date(rawDate);
        }
      } else {
        return;
      }

      const dTime = dateObj.getTime();
      if (isNaN(dTime)) return;
      const amount = Number(appt.totalAmount || 0);
      // ✅ MONTHLY FOR FULL YEAR
      if (dateObj.getFullYear() === Number(year) && paid && valid) {
        monthlyRevenue[dateObj.getMonth()] += amount;
      }

      // --- 1. GLOBAL DASHBOARD STATS (Unfiltered by month/year) ---
      if (valid) {
        // Today
        if (dateObj.toDateString() === todayStr) {
          stats.todayAppts++;
          if (paid) stats.todayRev += amount;
        }
        // Yesterday
        if (dateObj.toDateString() === yesterdayStr) {
          stats.yesterdayAppts++;
          if (paid) stats.yesterdayRev += amount;
        }

        // Week Clients
        if (dTime >= thisWeekStart.getTime() && dTime <= thisWeekEnd.getTime()) {
          const cid = appt.customer?.custId || appt.customer?.phone || appt.appointmentId;
          if (cid) stats.weekClients.add(cid);
        }
        // Last Week Clients
        if (dTime >= lastWeekStart.getTime() && dTime <= lastWeekEnd.getTime()) {
          const cid = appt.customer?.custId || appt.customer?.phone || appt.appointmentId;
          if (cid) stats.lastWeekClients.add(cid);
        }

        // Last Month Revenue (for Monthly Trend)
        if (paid && (dateObj.getMonth() + 1) === lastMonthNum && dateObj.getFullYear() === lastMonthYear) {
          stats.lastMonthRev += amount;
        }
      }


      // --- 2. REPORT DATA (Filtered by selected month/year) ---
      if (
        dateObj.getMonth() + 1 !== Number(month) ||
        dateObj.getFullYear() !== Number(year)
      ) {
        return;
      }

      if (!valid || !paid) return; // Filtering for existing report logic

      grossRevenue += amount;
      totalBookings += 1;
      // ✅ DAILY FILTERED BY SELECTED WEEK
      if (dateObj >= startOfWeek && dateObj < endOfWeek) {

        const dayIndex =
          Math.floor((dateObj - startOfWeek) / 86400000);

        if (dayIndex >= 0 && dayIndex < 7) {
          dailyChartData[dayIndex] += amount;
        }
      }

      // Daily Revenue Calculation


      const weekIndex = Math.floor((dateObj.getDate() - 1) / 7);

      if (weekIndex >= 0 && weekIndex < 5) {
        weeklyRevenue[weekIndex] += amount;
      }


      const services = Array.isArray(appt.services)
        ? appt.services
        : Array.isArray(appt.blocks)
          ? appt.blocks
          : [];

      services.forEach((service) => {
        let label = service.name;

        // Resolve from master if needed
        if (!label && service.serviceId && servicesMaster[service.serviceId]) {
          label = servicesMaster[service.serviceId].name;
        }

        // Fallback to category if name is unavailable
        if (!label) {
          label = service.category;
        }

        // Final fallback: never show ID
        const category = label || "Other";

        if (!categoryRevenue[category]) {
          categoryRevenue[category] = 0;
        }

        categoryRevenue[category] += Number(service.price || 0);
      });
    });

    const categorySplit = Object.entries(categoryRevenue).map(
      ([name, amount]) => ({
        name,
        amount,
        percentage: grossRevenue
          ? Math.round((amount / grossRevenue) * 100)
          : 0,
      })
    );

    // Calculate Trends
    const calcChange = (curr, prev) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Math.round(((curr - prev) / prev) * 100);
    };

    const dashboardStats = {
      todayAppointments: stats.todayAppts,
      todayAppointmentsChange: calcChange(stats.todayAppts, stats.yesterdayAppts),

      todayRevenue: stats.todayRev,
      todayRevenueChange: calcChange(stats.todayRev, stats.yesterdayRev),

      totalClients: stats.weekClients.size,
      totalClientsChange: calcChange(stats.weekClients.size, stats.lastWeekClients.size),

      lastMonthRevenue: stats.lastMonthRev
    };

    // Monthly Rev Change (Current Filtered Month vs Last Month)
    dashboardStats.monthlyRevenueChange = calcChange(grossRevenue, stats.lastMonthRev);

    const netProfit = Math.round(grossRevenue * 0.7);

    return res.status(200).json({
      success: true,
      data: {
        grossRevenue,
        netProfit,
        totalBookings,
        dailyRevenue: dailyChartData, // Array for Daily Chart
        weeklyRevenue,
        monthlyRevenue,
        categorySplit,
        dashboardStats // <--- NEW FIELD
      },
    });
  } catch (error) {
    console.error("REPORT ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate reports",
    });
  }
};

export const getStaffPerformance = async (req, res) => {
  try {
    const { placeId, month, year } = req.query;
    const selectedMonth = Number(month);
    const selectedYear = Number(year);

    // Start of month
    const monthStart = new Date(selectedYear, selectedMonth - 1, 1, 0, 0, 0, 0);

    // Start of next month
    const monthEnd = new Date(selectedYear, selectedMonth, 1, 0, 0, 0, 0);

    if (!placeId || !month || !year) {
      return res.status(400).json({
        success: false,
        message: "placeId, month and year required",
      });
    }

    console.log("📍 PLACE:", placeId);
    console.log("📅 FILTER:", month, year);

    // ✅ Detect salon or spa automatically
    let selectedType = "salon"; // default

    let appointmentPath = `salonandspa/appointments/${selectedType}/${placeId}`;
    let snapshot = await get(ref(db, appointmentPath));

    if (!snapshot.exists()) {

      selectedType = "spa"; // ⭐ SWITCH TYPE

      appointmentPath = `salonandspa/appointments/${selectedType}/${placeId}`;
      snapshot = await get(ref(db, appointmentPath));
    }


    const appointments = snapshot.val();

    console.log("✅ TOTAL APPOINTMENTS:", Object.keys(appointments).length);

    const staffStats = {};
    const currentDate = new Date();
    // ✅ FETCH REVIEWS ONCE
    const reviewRef = ref(db, `salonandspa/reviews/${selectedType}/${placeId}`);
    const reviewSnap = await get(reviewRef);

    // employeeId -> {sum, count}
    const ratingMap = {};

    if (reviewSnap.exists()) {

      const reviews = reviewSnap.val();

      for (const apptId in reviews) {

        const rev = reviews[apptId];
        const empId = rev.employeeId;

        if (!empId) continue;

        if (!ratingMap[empId]) {
          ratingMap[empId] = { sum: 0, count: 0 };
        }

        ratingMap[empId].sum += Number(rev.rating || 0);
        ratingMap[empId].count++;
      }
    }

    Object.values(appointments).forEach((appt) => {
      if (!appt) return;

      const status = (appt.status || "").toLowerCase();
      const paid = appt.paymentStatus === "paid";

      // ✅ SAFE DATE
      let dateObj;
      const rawDate = appt.date;

      if (!rawDate) return;


      if (typeof rawDate === "number") {
        dateObj = new Date(rawDate);
      }
      else if (typeof rawDate === "string") {

        // DD-MM-YYYY
        if (rawDate.includes("-") && rawDate.split("-")[0].length === 2) {
          const [d, m, y] = rawDate.split("-");

          // prevent timezone shift
          dateObj = new Date(Number(y), Number(m) - 1, Number(d), 12);
        }
        else {
          dateObj = new Date(rawDate);
        }
      }

      if (!dateObj || isNaN(dateObj.getTime())) return;

      // ✅ STRICT month filter
      if (dateObj < monthStart || dateObj >= monthEnd) {
        return;
      }
      const services = Array.isArray(appt.services)
        ? appt.services
        : [];

      services.forEach((service) => {

        const empId =
          service.employeeId ||
          service.staffId ||
          appt.employeeId;

        if (!empId) return;

        // Build employee bucket dynamically
        if (!staffStats[empId]) {
          staffStats[empId] = {
            employeeId: empId,
            totalBookings: 0,
            completed: 0,
            cancelled: 0,
            revenue: 0,
          };
        }

        staffStats[empId].totalBookings++;
        // ✅ YOUR STATUS LOGIC (unchanged)
        if (status !== "cancelled" && dateObj < currentDate) {
          staffStats[empId].completed++;
        }

        if (status === "cancelled") {
          staffStats[empId].cancelled++;
        }
        if (paid && !["cancelled"].includes(status)) {

          const price = Number(service.price ?? 0);

          staffStats[empId].revenue += price;
        }


      });
    });

    // ✅ FINAL METRICS
    const result = Object.values(staffStats).map((staff) => {

      const completionRate = staff.totalBookings
        ? Math.round((staff.completed / staff.totalBookings) * 100)
        : 0;

      const avgTicket = staff.totalBookings
        ? Math.round(staff.revenue / staff.totalBookings)
        : 0;
      const ratingData = ratingMap[staff.employeeId];

      const avgRating = ratingData
        ? Number((ratingData.sum / ratingData.count).toFixed(1))
        : 0;
      return {
        ...staff,
        performance: completionRate,
        avgTicket,
        avgRating,
        reviewCount: ratingData?.count || 0,
      };
    });

    // ⭐ Sort top performers
    result.sort((a, b) => {

      // ⭐ Push zero ratings to bottom
      if (a.avgRating === 0 && b.avgRating !== 0) return 1;
      if (b.avgRating === 0 && a.avgRating !== 0) return -1;

      // ⭐ Primary sort → Rating DESC
      if (b.avgRating !== a.avgRating) {
        return b.avgRating - a.avgRating;
      }

      // ⭐ Secondary → Revenue DESC (VERY important for ties)
      if (b.revenue !== a.revenue) {
        return b.revenue - a.revenue;
      }

      // ⭐ Third → Completed bookings DESC
      return b.completed - a.completed;
    });



    console.log("🔥 STAFF PERFORMANCE:", result);

    return res.status(200).json({
      success: true,
      data: result,
    });

  } catch (error) {

    console.error("🚨 STAFF PERFORMANCE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch staff performance",
    });
  }
};
