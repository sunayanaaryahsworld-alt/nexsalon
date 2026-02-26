import { notFound } from "next/navigation";
import Link from "next/link";

interface Blog {
  id?: string;
  title: string;
  author: string;
  date: string;
  image: string;
  content: string;
  slug: string;
}

export default async function BlogDetail({
  params,
}: {
  params: { locale: string; slug: string } | Promise<{ locale: string; slug: string }>;
}) {
  const { slug, locale } = await params;

  try {
    const res = await fetch(
      `http://localhost:3001/api/blog/${slug}`,
      { cache: "no-store" }
    );

    if (!res.ok) notFound();

    const data = await res.json();
    const blog: Blog = data.blog;

    if (!blog) notFound();

    return (
      <div className="bg-white min-h-screen">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

          {/* Back Button */}
          <Link
            href={`/${locale}/blog`}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black mb-10"
          >
            ← Back to Blog
          </Link>

          {/* Hero Image */}
          {blog.image && (
            <div className="mb-10">
              <img
                src={blog.image}
                alt={blog.title}
                className="w-full h-auto rounded-3xl object-cover max-h-[600px]"
              />
            </div>
          )}

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-black leading-tight mb-6">
            {blog.title}
          </h1>

          {/* Meta */}
          <p className="text-gray-500 text-sm mb-10">
            {blog.date} — by {blog.author}
          </p>

          {/* Content */}
          <div
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />

        </div>
      </div>
    );
  } catch (error) {
    notFound();
  }
}