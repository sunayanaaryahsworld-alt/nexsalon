"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";

const BLOG_CATEGORIES = [
  "Business",
  "Salon",
  "Skincare",
  "Spa",
  "Growth Tips",
];

export default function BlogFormPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale as string;

  const [form, setForm] = useState({
    title: "",
    slug: "",
    excerpt: "",
    category: "",
    content: "",
    author: "Admin",
    date: new Date().toDateString(),
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, "")
      .replace(/\s+/g, "-");
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === "title") {
      setForm({
        ...form,
        title: value,
        slug: generateSlug(value),
      });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!imageFile) return alert("Please select image");
    if (!form.category) return alert("Select category");

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("slug", form.slug);
      formData.append("excerpt", form.excerpt);
      formData.append("category", form.category);
      formData.append("content", form.content);
      formData.append("author", form.author);
      formData.append("date", form.date);
      formData.append("image", imageFile);

      const res = await fetch("http://localhost:3001/api/blog/create", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed");
        return;
      }

      router.push(`/${locale}/blog`);
    } catch (err) {
      console.error(err);
      alert("Error creating blog");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4EFEA] py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-lg">

        <h1 className="text-3xl font-semibold mb-8 text-center">
          Create New Blog
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* TITLE */}
          <input
            name="title"
            placeholder="Blog Title"
            value={form.title}
            onChange={handleChange}
            className="w-full border p-3 rounded-xl"
            required
          />

          {/* SLUG */}
          <input
            name="slug"
            value={form.slug}
            readOnly
            className="w-full border p-3 rounded-xl bg-gray-100"
          />

          {/* FEATURED IMAGE */}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                setImageFile(e.target.files[0]);
              }
            }}
            className="w-full border p-3 rounded-xl"
            required
          />

          {/* CATEGORY */}
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className="w-full border p-3 rounded-xl"
            required
          >
            <option value="">Select Category</option>
            {BLOG_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* EXCERPT */}
          <textarea
            name="excerpt"
            placeholder="Short description"
            value={form.excerpt}
            onChange={handleChange}
            rows={3}
            className="w-full border p-3 rounded-xl"
            required
          />

          {/* CONTENT */}
          <textarea
            name="content"
            placeholder="Write full blog content here..."
            value={form.content}
            onChange={handleChange}
            rows={10}
            className="w-full border p-3 rounded-xl resize-none"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="bg-[#3E2C2C] text-white px-8 py-3 rounded-xl"
          >
            {loading ? "Publishing..." : "Publish Blog"}
          </button>

        </form>
      </div>
    </div>
  );
}