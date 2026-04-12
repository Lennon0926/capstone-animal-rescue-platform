import Head from "next/head";
import Blog from "@/components/BlogPage/blog";
import HeaderSection from "@/components/Header/headerSection";
import FooterSection from "@/components/Footer/footerSection";

function BlogPage() {
  return (
    <div>
      <Head>
        <title>Blog | Huellitas Sin Hogar</title>
        <meta name="description" content="Mantente al día con las últimas noticias y actualizaciones de Huellitas Sin Hogar y la comunidad de Aguadilla." />
      </Head>
      <HeaderSection />
      <Blog />
      <FooterSection />
    </div>
  );
}

export default BlogPage;
