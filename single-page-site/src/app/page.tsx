"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

type SectionId =
  | "what-you-get"
  | "our-methods"
  | "courses"
  | "subscribe"
  | "join-now";

const navItems: { label: string; id: SectionId }[] = [
  { label: "What You Get", id: "what-you-get" },
  { label: "Our Methods", id: "our-methods" },
  { label: "Courses", id: "courses" },
  { label: "Subscribe", id: "subscribe" },
  { label: "Join Now", id: "join-now" },
];

const sectionContent: Record<
  SectionId,
  { title: string; subtitle: string; points: string[] }
> = {
  "what-you-get": {
    title: "What You Get",
    subtitle: "Honour, money, power, and freedom through practical execution.",
    points: ["Battle-tested frameworks", "Weekly strategic calls", "Action-first learning model"],
  },
  "our-methods": {
    title: "Our Methods",
    subtitle: "Reject weak theory and build influence with disciplined systems.",
    points: ["The 7 levels of power", "Ancient and modern strategy", "Results over lectures"],
  },
  courses: {
    title: "Courses",
    subtitle: "Learn the techniques of kings and emperors in level-based tracks.",
    points: ["Money Mastery - Level 1", "Power Mastery - Level 1", "Self Mastery - Level 1"],
  },
  subscribe: {
    title: "Subscribe",
    subtitle: "Choose your tier and get insider briefings, resources, and updates.",
    points: ["The Pawn - £19.99/mo", "The Knight - £33.99/mo", "The King - £77.99/mo"],
  },
  "join-now": {
    title: "Join Now",
    subtitle: "Enter a selective network built on loyalty, trust, and high standards.",
    points: ["Vetted membership path", "Private alliances", "Purpose with profit"],
  },
};

type Cleanup = () => void;

type WebGPUCanvasContext = {
  configure: (config: unknown) => void;
  getCurrentTexture: () => { createView: () => unknown };
};

type GPUWithNavigator = Navigator & {
  gpu?: {
    requestAdapter: () => Promise<{
      requestDevice: () => Promise<any>;
    } | null>;
    getPreferredCanvasFormat: () => string;
  };
};

function initWebGPU(canvas: HTMLCanvasElement | null): Promise<Cleanup> {
  let animationFrame: number | null = null;
  let shouldStop = false;
  let context: WebGPUCanvasContext | null = null;
  let device: any = null;

  const start = async () => {
    const browserNavigator = navigator as GPUWithNavigator;
    if (!browserNavigator.gpu || !canvas) {
      return () => {};
    }

    const adapter = await browserNavigator.gpu.requestAdapter();
    if (!adapter) {
      return () => {};
    }

    device = await adapter.requestDevice();
    context = canvas.getContext("webgpu") as WebGPUCanvasContext | null;
    if (!context) {
      return () => {};
    }
    const format = browserNavigator.gpu.getPreferredCanvasFormat();
    const dpr = Math.max(1, window.devicePixelRatio || 1);

    const shader = device.createShaderModule({
      code: `
        struct Uniforms {
          time: f32,
          aspect: f32,
          pad1: f32,
          pad2: f32
        };

        @group(0) @binding(0) var<uniform> uniforms: Uniforms;

        struct VSOut {
          @builtin(position) position: vec4<f32>,
          @location(0) uv: vec2<f32>
        };

        @vertex
        fn vsMain(@builtin(vertex_index) vertexIndex: u32) -> VSOut {
          var positions = array<vec2<f32>, 6>(
            vec2<f32>(-1.0, -1.0),
            vec2<f32>( 1.0, -1.0),
            vec2<f32>(-1.0,  1.0),
            vec2<f32>(-1.0,  1.0),
            vec2<f32>( 1.0, -1.0),
            vec2<f32>( 1.0,  1.0)
          );

          var out: VSOut;
          out.position = vec4<f32>(positions[vertexIndex], 0.0, 1.0);
          out.uv = positions[vertexIndex];
          return out;
        }

        @fragment
        fn fsMain(in: VSOut) -> @location(0) vec4<f32> {
          let uv = vec2<f32>(in.uv.x * uniforms.aspect, in.uv.y);
          let t = uniforms.time * 0.5;

          let wave1 = sin((uv.x * 3.5) + t) * 0.15;
          let wave2 = cos((uv.y * 4.2) - t * 1.4) * 0.15;
          let glow = 1.0 / (1.0 + 7.0 * length(uv + vec2<f32>(wave1, wave2)));
          let pulse = 0.5 + 0.5 * sin(t * 2.4 + uv.x * 2.0 - uv.y * 1.3);

          let black = vec3<f32>(0.01, 0.01, 0.01);
          let white = vec3<f32>(0.95, 0.95, 0.95);
          let gold = vec3<f32>(0.75, 0.60, 0.18);

          let base = mix(black, white, clamp(glow * 0.2, 0.0, 1.0));
          let accent = mix(gold, white, pulse * 0.35);
          let color = mix(base, accent, glow * 0.9);

          return vec4<f32>(color, 1.0);
        }
      `,
    });

    const pipeline = device.createRenderPipeline({
      layout: "auto",
      vertex: {
        module: shader,
        entryPoint: "vsMain",
      },
      fragment: {
        module: shader,
        entryPoint: "fsMain",
        targets: [{ format }],
      },
      primitive: {
        topology: "triangle-list",
      },
    });

    // UNIFORM (0x40) + COPY_DST (0x08)
    const uniformBuffer = device.createBuffer({
      size: 16,
      usage: 0x40 | 0x08,
    });

    const bindGroup = device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [{ binding: 0, resource: { buffer: uniformBuffer } }],
    });

    const resize = () => {
      const width = Math.max(1, Math.floor(window.innerWidth * dpr));
      const height = Math.max(1, Math.floor(window.innerHeight * dpr));
      canvas.width = width;
      canvas.height = height;
      context.configure({
        device,
        format,
        alphaMode: "opaque",
      });
    };
    resize();
    window.addEventListener("resize", resize);

    const uniformData = new Float32Array(4);
    const startTime = performance.now();

    const frame = () => {
      if (shouldStop) return;

      const elapsed = (performance.now() - startTime) / 1000;
      uniformData[0] = elapsed;
      uniformData[1] = canvas.width / canvas.height;
      device.queue.writeBuffer(uniformBuffer, 0, uniformData.buffer);

      const encoder = device.createCommandEncoder();
      const textureView = context.getCurrentTexture().createView();
      const pass = encoder.beginRenderPass({
        colorAttachments: [
          {
            view: textureView,
            loadOp: "clear",
            storeOp: "store",
            clearValue: { r: 0, g: 0, b: 0, a: 1 },
          },
        ],
      });

      pass.setPipeline(pipeline);
      pass.setBindGroup(0, bindGroup);
      pass.draw(6, 1, 0, 0);
      pass.end();

      device.queue.submit([encoder.finish()]);
      animationFrame = requestAnimationFrame(frame);
    };

    animationFrame = requestAnimationFrame(frame);

    return () => {
      shouldStop = true;
      if (animationFrame) cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
    };
  };

  return start();
}

export default function Home() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let cleanupWebGPU = () => {};
    let active = true;

    initWebGPU(canvasRef.current)
      .then((cleanup) => {
        if (active && typeof cleanup === "function") cleanupWebGPU = cleanup;
      })
      .catch(() => {
        cleanupWebGPU = () => {};
      });

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".content-section").forEach((section) => {
        gsap.from(section, {
          y: 90,
          opacity: 0,
          duration: 1.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: section,
            start: "top 78%",
            end: "bottom 20%",
            toggleActions: "play none none reverse",
          },
        });
      });

      gsap.utils.toArray<HTMLElement>(".content-section").forEach((section) => {
        const id = section.getAttribute("id");
        if (!id) return;
        const link = document.querySelector(`a[href="#${id}"]`);
        if (!link) return;

        ScrollTrigger.create({
          trigger: section,
          start: "top center",
          end: "bottom center",
          onEnter: () => link.classList.add("is-active"),
          onEnterBack: () => link.classList.add("is-active"),
          onLeave: () => link.classList.remove("is-active"),
          onLeaveBack: () => link.classList.remove("is-active"),
        });
      });

      gsap.to(".floating-orb", {
        y: (index: number) => (index % 2 === 0 ? -28 : 30),
        x: (index: number) => (index % 2 === 0 ? 20 : -20),
        duration: (index: number) => 3 + index * 0.45,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: 0.1,
      });
    }, rootRef);

    return () => {
      active = false;
      ctx.revert();
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      cleanupWebGPU();
    };
  }, []);

  return (
    <div
      id="top"
      ref={rootRef}
      className="app-shell relative min-h-screen overflow-x-hidden bg-black text-white"
    >
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 -z-20 h-full w-full opacity-55"
        aria-hidden="true"
      />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(190,153,46,0.25),transparent_40%),radial-gradient(circle_at_80%_70%,rgba(255,255,255,0.1),transparent_45%)]" />

      <header className="fixed left-1/2 top-0 z-30 w-full -translate-x-1/2 px-[clamp(0.75rem,2.4vw,2rem)] pt-[clamp(0.6rem,1.8vw,1.4rem)]">
        <nav className="mx-auto flex min-h-[clamp(3.6rem,6.4vw,4.8rem)] w-full max-w-[min(98vw,120rem)] items-center justify-between gap-[clamp(0.5rem,1.2vw,1.1rem)] rounded-full border border-[#BE992E]/35 bg-black/85 px-[clamp(0.45rem,1vw,0.9rem)] py-[clamp(0.3rem,0.9vw,0.55rem)] shadow-[0_0_28px_rgba(190,153,46,0.2)] backdrop-blur-xl">
          <a
            href="#top"
            className="inline-flex h-[clamp(2.1rem,3.8vw,2.8rem)] min-w-[clamp(5rem,9vw,7.2rem)] items-center justify-center rounded-full border border-[#BE992E]/65 bg-[#BE992E]/15 px-[clamp(0.55rem,1vw,0.8rem)] text-[#f8efcf] transition duration-300 hover:bg-[#BE992E]"
            aria-label="Go to top"
          >
            <Image
              src="/syndicate-logo.png"
              alt="Syndicate logo"
              width={140}
              height={44}
              priority
              className="h-[clamp(1.4rem,2.5vw,2rem)] w-auto object-contain"
            />
          </a>

          <div className="grid min-w-0 w-[clamp(20rem,72vw,64rem)] grid-cols-5 items-center gap-[clamp(0.3rem,0.7vw,0.65rem)]">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="nav-item inline-flex min-w-0 h-[clamp(2rem,3.4vw,2.5rem)] w-full items-center justify-center overflow-hidden whitespace-nowrap rounded-full border border-[#BE992E]/55 px-[clamp(0.25rem,0.7vw,0.55rem)] text-center text-[clamp(0.54rem,0.74vw,0.75rem)] font-semibold tracking-[0.06em] text-[#f7eccc] transition duration-300 hover:bg-[#BE992E] hover:text-black"
              >
                <span className="block w-full overflow-hidden text-ellipsis px-1">
                  {item.label}
                </span>
              </a>
            ))}
          </div>
        </nav>
      </header>

      <main className="relative z-10 pt-[clamp(5.3rem,10vw,7.6rem)]">
        {navItems.map((item, index) => (
          <section
            key={item.id}
            id={item.id}
            className="content-section mx-auto flex min-h-[calc(100dvh-clamp(5.3rem,10vw,7.6rem))] w-full max-w-7xl scroll-mt-[clamp(5.3rem,10vw,7.6rem)] items-center px-[clamp(1rem,4vw,2rem)] py-[clamp(3rem,6vw,6rem)]"
          >
            <div className="grid w-full gap-10 lg:grid-cols-2 lg:gap-16">
              <div className="space-y-6">
                <p className="text-sm font-semibold tracking-[0.25em] text-[#BE992E]">
                  {String(index + 1).padStart(2, "0")} / 05
                </p>
                <h2 className="text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
                  {sectionContent[item.id].title}
                </h2>
                <p className="max-w-xl text-lg text-zinc-300 sm:text-xl">
                  {sectionContent[item.id].subtitle}
                </p>
                <div className="flex flex-wrap gap-3 pt-2">
                  {sectionContent[item.id].points.map((point) => (
                    <span
                      key={point}
                      className="rounded-full border border-[#BE992E]/45 bg-white/[0.05] px-4 py-2 text-sm text-[#f2e6c4]"
                    >
                      {point}
                    </span>
                  ))}
                </div>
                {item.id === "what-you-get" && (
                  <p className="max-w-2xl border-l-2 border-[#BE992E] pl-4 text-sm leading-7 text-zinc-400">
                    Every day is a battle for control in a competitive economy.
                    This page is designed as a strategic onboarding flow to help
                    members move from survival to mastery.
                  </p>
                )}
              </div>

              <div className="relative">
                <div className="gold-glow relative overflow-hidden rounded-3xl border border-[#BE992E]/45 bg-black/35 p-8 backdrop-blur">
                  <div className="pointer-events-none absolute -left-8 -top-8 h-36 w-36 rounded-full bg-[#BE992E]/35 blur-3xl" />
                  <div className="pointer-events-none absolute -bottom-8 right-0 h-36 w-36 rounded-full bg-white/20 blur-3xl" />

                  <h3 className="relative text-2xl font-bold text-[#f8eecf]">
                    {sectionContent[item.id].title} Experience
                  </h3>
                  <p className="relative mt-4 max-w-md text-zinc-200">
                    Designed with cinematic motion and premium interaction
                    patterns to present your movement, your courses, and your
                    conversion path with authority.
                  </p>

                  {item.id === "courses" ? (
                    <div className="relative mt-8 space-y-3">
                      {[
                        { name: "Money Mastery - Level 1", cta: "ENROL TODAY", price: "£333.00" },
                        { name: "Power Mastery - Level 1", cta: "JOIN NOW", price: "Application" },
                        { name: "Self Mastery - Level 1", cta: "JOIN NOW", price: "Application" },
                      ].map((course) => (
                        <div
                          key={course.name}
                          className="rounded-xl border border-[#BE992E]/35 bg-black/45 p-4"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-[#f7eccc]">{course.name}</p>
                            <span className="text-xs uppercase tracking-wider text-[#BE992E]">
                              {course.price}
                            </span>
                          </div>
                          <p className="mt-2 text-xs tracking-[0.2em] text-zinc-400">{course.cta}</p>
                        </div>
                      ))}
                    </div>
                  ) : item.id === "subscribe" ? (
                    <div className="relative mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {["The Pawn", "The Knight", "The King"].map((tier, tierIndex) => (
                        <div
                          key={tier}
                          className="floating-orb rounded-xl border border-[#BE992E]/35 bg-black/45 p-4 text-center"
                        >
                          <p className="text-sm font-semibold text-[#f7eccc]">{tier}</p>
                          <p className="mt-1 text-xs text-zinc-400">
                            {tierIndex === 0
                              ? "£19.99/mo"
                              : tierIndex === 1
                                ? "£33.99/mo"
                                : "£77.99/mo"}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="relative mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {[...Array(4)].map((_, orbIndex) => (
                        <div
                          key={`${item.id}-${orbIndex}`}
                          className="floating-orb h-14 rounded-xl border border-[#BE992E]/45 bg-gradient-to-br from-[#BE992E]/35 to-white/10"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
