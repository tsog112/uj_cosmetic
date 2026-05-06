import Image from 'next/image';
import Link from 'next/link';

export default function AboutSection() {
  return (
    <section className="py-20 md:py-28 border-thin-t bg-white" id="about-section">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Image */}
          <div className="relative aspect-[4/5] lg:aspect-[3/4] overflow-hidden bg-cream-dark">
            <Image
              src="/images/brand/about.png"
              alt="UJ Cosmetic brand story"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>

          {/* Text */}
          <div className="lg:pl-6">
            <p className="section-label">Бидний тухай</p>
            <h2 className="section-heading mb-8">
              Байгалийн хүч,<br />
              Солонгос технологи
            </h2>
            <div className="space-y-5 text-sm text-text-muted leading-relaxed max-w-[480px]">
              <p>
                UJ Cosmetic нь Солонгосын дэвшилтэт арьс арчилгааны технологийг Монгол эмэгтэйчүүдийн арьсны онцлогт тохируулан бүтээсэн брэнд юм.
              </p>
              <p>
                Бид байгалийн гаралтай найрлагыг шинжлэх ухааны судалгаатай хослуулж, арьсыг дотроос нь тэжээн гэрэлтүүлдэг бүтээгдэхүүнүүдийг санал болгодог.
              </p>
              <p>
                Монгол орны хуурай, хүйтэн уур амьсгалд тохирсон, гүн чийгшүүлэх үйлдэлтэй бүтээгдэхүүнүүд нь таны арьсны хамгийн найдвартай хамгаалагч болно.
              </p>
            </div>
            <Link href="/about" className="btn-outline mt-10 inline-flex">
              Дэлгэрэнгүй
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
