import { ThumbnailsCarousel } from "@/components/ui/signature";

export default function DemoOne() {
  return (
    <div className="py-12 bg-[#fcf8f7]">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-[#2a2019] mb-2">Verified Transformations</h2>
          <p className="text-[#2a2019]/60">Real users, real results from our Face Yoga programs.</p>
        </div>
        <ThumbnailsCarousel />
      </div>
    </div>
  );
}
