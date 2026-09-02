# Reflexología Holística

Landing inmersiva en Next.js para presentar reflexología podal, acroreflexología, abordaje cráneo-facial y lectura de pies. La interfaz informa y convierte exclusivamente mediante WhatsApp: no ofrece agenda, selector de horarios, formulario de datos, reserva interna ni persistencia administrada.

## Estado del producto

- Canal de conversión: WhatsApp-only.
- Número local configurado por fallback: `5491169702403`.
- URL pública e indexación técnica: `https://lilireflex.capacero.ar`, con rastreo habilitado.
- Datos comerciales variables: se consultan por WhatsApp; no se inventan duración, precios, horarios ni ubicación.
- QA local: reproducible con los comandos de esta página.
- Producción: pendiente de confirmación del número, autorización de assets, validación comercial, aprobación visual del propietario y aprobación de publicación.

## Desarrollo local

Requisitos: Node.js compatible con Next.js 16 y npm.

```bash
npm install
npm run dev
```

Abrir `http://localhost:3000`.

## Validación reproducible

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

La suite verifica el contrato WhatsApp-only, la ausencia de APIs y providers de booking, los mensajes contextuales, los assets aceptados, las tres composiciones `ReflexField`, las superficies visuales y el presupuesto de un único runtime Three.js/WebGL.

## Arquitectura visual

La página utiliza una sola superficie continua:

- fallback sólido nocturno `#0b0712`;
- un fondo fijo basado en `public/brand/lili-lotus-background.jpg`;
- un único `VisualStage`, canvas, `THREE.WebGLRenderer`, escena, cámara ortográfica, plano fullscreen, shader y scheduler de RAF;
- un nodo CSS global de atmósfera con dos pseudo-elementos;
- SVG de identidad y navegación editorial;
- ventanas glass translúcidas con blur real limitado al header, menú, hero y CTA;
- `ReflexField` determinista en hero, introducción y beneficios;
- frame estático en touch/reduced motion y fallback CSS en ahorro de datos, memoria baja o viewport menor a 320 px;
- tiers adaptativos de 60, 45 y 30 FPS con pausa durante scroll sostenido.

Three.js se carga dinámicamente sólo en el cliente. El contenido y la mayor parte de las secciones permanecen como Server Components; sólo menú, mapa, FAQ y runtime visual hidratan interacción.

## Assets y colorimetría

- `lili-lotus-background.jpg`: fondo global indicado por el propietario.
- `pearlescent-foot.png`: identidad visual en hero, campos, lectura de pies, CTA y wordmark.
- La iluminación ambiental se resuelve con tres gradientes radiales CSS que se atenúan y reaparecen cada 5,2 a 7,6 segundos en zonas acotadas y aleatorias; no responde al puntero, no publica imágenes florales ni incorpora adornos botánicos.
- El flyer de referencia no se publica: se conserva sólo como referencia documental de lavandas cálidos, rosa nacarado y blanco crema.

`docs/images.jpeg` y `docs/images2.jpeg` conservan sus originales y tienen conversiones no destructivas `docs/images.png` y `docs/images2.png`. Ambas conversiones permanecen fuera de `public/` y no forman parte de la interfaz publicada.

El PNG original conserva su fondo oscuro; la interfaz lo integra mediante mezcla `screen` sobre el campo violeta para mantener bordes nacarados sin generar una copia destructiva.

## WhatsApp

Todos los enlaces se construyen en `src/lib/whatsapp.ts` mediante:

```ts
buildWhatsAppUrl({ source, technique, promotion, message })
```

Los CTA de header, hero, técnicas, mapa, lectura, experiencia, propuestas, FAQ, CTA final, sticky mobile y flotante desktop usan esa fuente única. Los mensajes no contienen datos médicos ni afirman confirmación de una sesión.

## Reservas históricas

`data/reservations.json` se conserva intacto, ignorado por Git y fuera del runtime. No se lee, copia, migra ni elimina. Las antiguas APIs, providers, stores, migración Supabase y pruebas de booking fueron retiradas del producto porque ya no tienen consumidores.

## Validaciones de publicación pendientes

La indexación técnica está habilitada. La aprobación integral del producto sigue requiriendo evidencias actuales de:

1. número de WhatsApp confirmado;
2. autorización/licencia de los assets publicados;
3. modalidad, valores, duración y ubicación validados cuando corresponda;
4. QA visual desktop/mobile, teclado, reduced motion, contraste y consola sobre el build desplegado;
5. aprobación visual del propietario y aprobación explícita de publicación.

Los PASS locales no equivalen a despliegue, autorización comercial ni producción lista.
