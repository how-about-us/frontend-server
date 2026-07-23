import { LandingHeader } from "@/app/_components/LandingHeader";
import { ProductTourFinalCta } from "@/app/product/_components/ProductTourFinalCta";
import { ProductTourHero } from "@/app/product/_components/ProductTourHero";
import {
  ProductTourCollaboration,
  ProductTourStory,
} from "@/app/product/_components/ProductTourStep";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { PRODUCT_TOUR_STEPS } from "@/lib/product/product-tour-content";

export function ProductTourView() {
  return (
    <div className="relative flex min-h-screen flex-col bg-white font-sans">
      <LandingHeader />
      <main className="relative z-10 flex flex-1 flex-col antialiased">
        <ProductTourHero />
        {PRODUCT_TOUR_STEPS.map((step, index) =>
          step.layout === "wide" ? (
            <ProductTourStory
              key={step.id}
              step={step}
              tone={index % 2 === 0 ? "white" : "tint"}
            />
          ) : (
            <ProductTourCollaboration
              key={step.id}
              step={step}
              tone={index % 2 === 0 ? "white" : "tint"}
            />
          ),
        )}
        <ProductTourFinalCta />
      </main>
      <SiteFooter className="font-sans" />
    </div>
  );
}
