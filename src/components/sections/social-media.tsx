import Image from "next/image";
import { Play } from "lucide-react";
import SectionHeading from "@/components/ui/section-heading";
import Container from "@/components/ui/container";
import FadeIn from "@/components/ui/fade-in";
import { YoutubeIcon, InstagramIcon, TikTokIcon } from "@/components/icons/social-icons";

const videos = [
  {
    platform: "YouTube",
    icon: YoutubeIcon,
    title: "Dell XPS 13 9310 – Power Meets Elegance",
    handle: "@kaaku_reviews",
    href: "https://youtube.com/shorts/xYoDHfQ7XkQ",
    thumbnail: "/social/youtube-1.jpg",
    accent: "bg-[#FF0000]",
  },
  {
    platform: "Instagram",
    icon: InstagramIcon,
    title: "Watch Our Latest Reel",
    handle: "@ch._asadullah",
    href: "https://www.instagram.com/reel/DNNKetVgTIE/",
    thumbnail: "/social/instagram-1.jpg",
    accent: "bg-gradient-to-br from-[#f09433] via-[#dc2743] to-[#bc1888]",
  },
  {
    platform: "TikTok",
    icon: TikTokIcon,
    title: "Budget Beast Gaming PC – Core i5 + RX 570 Build",
    handle: "@kaaku_reviews",
    href: "https://vt.tiktok.com/ZSVYT2cyy/",
    thumbnail: "/social/tiktok-1.png",
    accent: "bg-navy",
  },
];

export default function SocialMedia() {
  return (
    <section aria-labelledby="social-heading" className="bg-soft-gray py-20 sm:py-24">
      <Container>
        <SectionHeading
          headingId="social-heading"
          eyebrow="Follow Along"
          title="Our Social Media Videos"
          description="See our latest product drops, unboxings and behind-the-scenes moments across YouTube, Instagram and TikTok."
        />

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((video, i) => (
            <FadeIn key={video.title} delay={i * 0.08}>
              <a
                href={video.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group block overflow-hidden rounded-2xl border border-light-gray bg-white premium-shadow transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_1px_2px_rgba(15,23,42,0.06),0_20px_40px_-16px_rgba(29,78,216,0.28)]"
                aria-label={`Watch "${video.title}" on ${video.platform}`}
              >
                <div
                  className={`relative flex aspect-[9/12] items-center justify-center overflow-hidden ${
                    video.thumbnail ? "bg-navy" : video.accent
                  }`}
                >
                  {video.thumbnail ? (
                    <>
                      <Image
                        src={video.thumbnail}
                        alt=""
                        fill
                        quality={75}
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-navy/35" aria-hidden="true" />
                    </>
                  ) : (
                    <div
                      className="absolute inset-0 opacity-10"
                      style={{
                        backgroundImage:
                          "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
                        backgroundSize: "28px 28px",
                      }}
                      aria-hidden="true"
                    />
                  )}
                  <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
                    <Play className="h-6 w-6 translate-x-0.5 fill-white text-white" aria-hidden="true" />
                  </span>
                  <span
                    className={`absolute left-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-white ${video.accent}`}
                    aria-hidden="true"
                  >
                    <video.icon className="h-4.5 w-4.5" />
                  </span>
                </div>
                <div className="p-5">
                  <p className="line-clamp-2 text-sm font-semibold text-navy">{video.title}</p>
                  <p className="mt-1 text-xs font-medium text-slate">
                    {video.platform} · {video.handle}
                  </p>
                </div>
              </a>
            </FadeIn>
          ))}
        </div>
      </Container>
    </section>
  );
}
