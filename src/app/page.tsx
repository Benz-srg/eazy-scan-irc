import Landing from "@/components/landing/Landing";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "EazyScan",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "ผู้ช่วย AI ที่เปลี่ยนเสียงสนทนา Requirement ของลูกค้าให้กลายเป็น Scope of Work และการประเมิน Manday",
  offers: { "@type": "Offer", price: "0", priceCurrency: "THB" },
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Landing />
    </>
  );
}
