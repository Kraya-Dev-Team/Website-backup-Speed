"use client";

import React from "react";
import SixSideCube, { AnimationDataItem } from "@/components/ui/SixSideCube";

// --- DYNAMIC DATA --- 
// In the future, you can easily pull this from an API and pass it as props!
export const ANIMATION_DATA: AnimationDataItem[] = [
  {
    faceName: "CRAFT",
    imageSrc: "/six/3.jpg",
    tag: "Chapter 01 — Artistry",
    title: "AGED\nWITH\nINTENT",
    description:
      "Our fragrances are not rushed. They are matured over time, allowing each layer to evolve into a composition that feels alive on your skin.",
    alignment: "left",
  },
  {
    faceName: "INGREDIENTS",
    imageSrc: "/six/2.jpg",
    tag: "Chapter 02 — Botanicals",
    title: "RARE\nEARTH\nNOTES",
    description:
      "From sacred woods to rare blossoms, every ingredient is chosen with purpose. Nothing artificial—only elements that carry depth, purity, and story.",
    alignment: "right",
  },
  {
    faceName: "THE ORIGIN",
    imageSrc: "/six/1.JPG",
    tag: "Chapter 03 — Essence",
    title: "THE\nSOUL\nOF\nKRAYA",
    description:
      "Kraya is liberation distilled into scent. A weightless, airy composition that unfolds with luminous clarity, guiding the spirit toward a state of eternal peace and effortless freedom.",
    alignment: "left",
  },
  {
    faceName: "PERFORMANCE",
    imageSrc: "/six/4.JPG",
    tag: "Chapter 04 — Presence",
    title: "A\nLASTING\nAURA",
    description:
      "Designed to stay. A single application creates an aura that moves with you—soft yet unmistakable, leaving behind a signature trail.",
    alignment: "right",
    stats: [
      { value: "8h+", label: "Longevity" },
    ],
  },
  {
    faceName: "EXPRESSION",
    imageSrc: "/six/6.jpg",
    tag: "Chapter 05 — Identity",
    title: "WEAR\nYOUR\nESSENCE",
    description:
      "More than fragrance—this is identity. Each creation becomes a part of you, silently expressing who you are.",
    alignment: "left",
  },
  {
    faceName: "PHILOSOPHY",
    imageSrc: "/six/5.JPG",
    tag: "Chapter 06 — Kraya",
    title: "THE\nSTATE\nOF\nRELEASE",
    description:
      "Kraya is freedom in its purest form. A scent designed to calm, to center, and to elevate—connecting you to something beyond the material.",
    alignment: "right",
  },
];

export default function SixSideAnimation() {
  return <SixSideCube data={ANIMATION_DATA} />;
}
