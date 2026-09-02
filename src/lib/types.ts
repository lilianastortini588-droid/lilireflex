export type TechniqueId = "podal" | "manos" | "rostro" | "lectura";

export type Technique = {
  id: TechniqueId;
  label: string;
  eyebrow: string;
  description: string;
  detail: string;
  phrases: readonly string[];
  cta: string;
  message: string;
};

export type Benefit = {
  id: string;
  title: string;
  body: string;
};

export type ExperienceStep = {
  id: string;
  title: string;
  body: string;
};

export type Faq = {
  id: string;
  question: string;
  answer: string;
};
