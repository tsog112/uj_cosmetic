import HeroSection from '@/components/sections/HeroSection';
import FeaturedProducts from '@/components/sections/FeaturedProducts';
import AboutSection from '@/components/sections/AboutSection';
import CategorySection from '@/components/sections/CategorySection';
import InstagramSection from '@/components/sections/InstagramSection';

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturedProducts />
      <AboutSection />
      <CategorySection />
      <InstagramSection />
    </>
  );
}
