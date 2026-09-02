import type {
  Benefit,
  ExperienceStep,
  Faq,
  Technique,
} from "./types";

/**
 * Fuente de verdad pública de Reflexología Holística.
 * Los datos comerciales variables se consultan directamente por WhatsApp.
 */
export const site = {
  brand: {
    name: "Lili",
    descriptor: "Reflexología Holística",
    fullName: "REFLEXOLOGÍA HOLÍSTICA",
  },
  locale: "es-AR",
  timezone: "America/Argentina/Buenos_Aires",
  url: "https://lilireflex.capacero.ar",
  contact: {
    whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "5491169702403",
    locationLabel: process.env.NEXT_PUBLIC_LOCATION_LABEL ?? "",
  },
  nav: [
    { href: "#inicio", label: "Inicio" },
    { href: "#tecnicas", label: "Técnicas" },
    { href: "#lectura-de-pies", label: "Lectura de pies" },
    { href: "#experiencia", label: "Experiencia" },
    { href: "#preguntas", label: "Preguntas" },
    { href: "#contacto", label: "Contacto" },
  ],
  techniques: [
    {
      id: "podal",
      label: "Reflexología podal",
      eyebrow: "Pies",
      description:
        "Un sistema de masajes, presiones y estimulaciones sobre zonas específicas de los pies, inspirado en principios holísticos y adaptado a cada persona.",
      detail:
        "El trabajo manual invita a soltar tensión, descansar el apoyo y recuperar una sensación de equilibrio corporal.",
      phrases: [
        "El bienestar comienza desde la base.",
        "Cada apoyo guarda una historia.",
        "Un momento para volver a sentir tus pasos.",
      ],
      cta: "Consultar por reflexología podal",
      message:
        "Hola Lili, vi la propuesta de Reflexología Holística y quisiera consultar por una sesión de reflexología podal. ¿Podés contarme modalidad, duración, valor y disponibilidad?",
    },
    {
      id: "manos",
      label: "Acroreflexología",
      eyebrow: "Reflexología en manos",
      description:
        "Un trabajo delicado sobre zonas reflejas de las manos, ideal para crear una experiencia de relajación, presencia y conexión corporal.",
      detail:
        "Las manos acompañan cada gesto cotidiano. Su observación y estimulación abren otra vía para registrar tensiones, ritmos y formas de expresión.",
      phrases: [
        "Las manos también guardan mapas de experiencia.",
        "Cada gesto deja una huella.",
        "Un abordaje accesible, preciso y personal.",
      ],
      cta: "Consultar por acroreflexología",
      message:
        "Hola Lili, vi la propuesta de acroreflexología y quisiera conocer cómo es la sesión, su duración, valor y disponibilidad.",
    },
    {
      id: "rostro",
      label: "Reflexología cráneo-facial",
      eyebrow: "Rostro",
      description:
        "Una estimulación suave de zonas del rostro y el cráneo que propone una experiencia de descanso, serenidad y atención al momento presente.",
      detail:
        "El rostro reúne gestos, expresiones y tensiones cotidianas. Este recorrido sutil invita a aflojar, respirar y volver a habitar el presente.",
      phrases: [
        "Un recorrido sutil hacia la calma.",
        "Aflojar el gesto también es regalarse una pausa.",
        "Presencia, suavidad y descanso.",
      ],
      cta: "Consultar por reflexología cráneo-facial",
      message:
        "Hola Lili, vi la propuesta de reflexología cráneo-facial y quisiera conocer la modalidad, duración, valor y disponibilidad.",
    },
    {
      id: "lectura",
      label: "Lectura de pies",
      eyebrow: "Lectura y autoconocimiento",
      description:
        "Una observación holística de la forma, los apoyos, la textura, la movilidad, las tensiones y las huellas del caminar.",
      detail:
        "La lectura transforma señales sutiles en preguntas, conversación y autoconocimiento.",
      phrases: [
        "Cada apoyo aporta una parte del relato.",
        "El cuerpo guarda memoria en gestos y ritmos.",
        "Comprender la base abre nuevas preguntas.",
      ],
      cta: "Consultar por una lectura de pies",
      message:
        "Hola Lili, vi la propuesta de lectura de pies. Quisiera conocer cómo es la experiencia, qué incluye, su duración, valor y disponibilidad.",
    },
  ] satisfies readonly Technique[],
  benefits: [
    {
      id: "pausa",
      title: "Pausa",
      body: "Un tiempo para bajar el ritmo y volver a registrar el cuerpo.",
    },
    {
      id: "relajacion",
      title: "Relajación",
      body: "Maniobras suaves que acompañan una sensación de descanso y liviandad.",
    },
    {
      id: "presencia",
      title: "Presencia corporal",
      body: "Una invitación a reconocer apoyos, gestos, tensiones y sensaciones.",
    },
    {
      id: "conexion",
      title: "Conexión",
      body: "Un encuentro para escuchar lo que tu cuerpo expresa en el presente.",
    },
    {
      id: "cuidado",
      title: "Cuidado personalizado",
      body: "Cada sesión se adapta a la técnica elegida y al momento de cada persona.",
    },
    {
      id: "autoconocimiento",
      title: "Autoconocimiento",
      body: "La observación holística puede abrir nuevas preguntas sobre hábitos, apoyos y formas de transitar lo cotidiano.",
    },
  ] satisfies readonly Benefit[],
  experienceSteps: [
    {
      id: "01",
      title: "Conversamos",
      body: "El encuentro comienza con una consulta breve para conocer qué técnica te interesa y qué tipo de experiencia estás buscando.",
    },
    {
      id: "02",
      title: "Elegimos el abordaje",
      body: "Podal, manos, cráneo-facial o lectura de pies: cada propuesta tiene una identidad propia y puede combinarse según la modalidad disponible.",
    },
    {
      id: "03",
      title: "Coordinamos",
      body: "Lili comparte por WhatsApp la información actualizada sobre modalidad, duración, valor y horarios.",
    },
    {
      id: "04",
      title: "Vivís tu momento",
      body: "La sesión se desarrolla como un espacio de presencia, cuidado y atención personalizada.",
    },
  ] satisfies readonly ExperienceStep[],
  faqs: [
    {
      id: "coordinar",
      question: "¿Cómo coordino?",
      answer:
        "La coordinación se realiza directamente con Lili por WhatsApp, donde recibirás información actualizada sobre horarios, modalidad y valores.",
    },
    {
      id: "tecnica",
      question: "¿Qué técnica puedo elegir?",
      answer:
        "Podal, acroreflexología, cráneo-facial y lectura de pies forman parte de la propuesta. Lili puede orientarte según la experiencia que estés buscando.",
    },
    {
      id: "duracion",
      question: "¿Cuánto dura?",
      answer:
        "La duración depende de la técnica o combinación elegida. Lili te comparte el detalle actualizado durante la consulta.",
    },
    {
      id: "valor",
      question: "¿Cuál es el valor?",
      answer:
        "Los valores y promociones se informan por WhatsApp para que recibas siempre la propuesta vigente.",
    },
    {
      id: "ubicacion",
      question: "¿Dónde se realiza?",
      answer: "La ubicación y modalidad se comparten al coordinar el encuentro.",
    },
    {
      id: "lectura",
      question: "¿Cómo es una lectura de pies?",
      answer:
        "Es una observación holística de formas, apoyos, movilidad, textura y señales del caminar, acompañada por una conversación orientada al autoconocimiento.",
    },
    {
      id: "regalo",
      question: "¿Puedo regalar una sesión?",
      answer:
        "Las opciones disponibles para regalar se coordinan directamente por WhatsApp.",
    },
  ] satisfies readonly Faq[],
} as const;

export function getTechnique(id: string | null | undefined) {
  return site.techniques.find((technique) => technique.id === id);
}
