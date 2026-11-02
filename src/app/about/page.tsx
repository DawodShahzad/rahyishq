import Image from 'next/image';
import Link from 'next/link';
import { 
  Sparkles, 
  BookOpen, 
  Eye, 
  HeartHandshake, 
  Clock, 
  MapPin, 
  Award, 
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { SITE_STATS } from '@/data/initialData';

export const metadata = {
  title: 'About Hazrat Sufi Abu Anees Muhammad Barkat Ali (R.A.) | Life, Teachings & Dar-ul-Ehsan',
  description: 'Chronicle of the life, military service, spiritual ascension, humanitarian miracles, and literary legacy of Hazrat Sufi Abu Anees Muhammad Barkat Ali Ludhianvi.',
};

export default function AboutPage() {
  const timelineEvents = [
    {
      year: '1911',
      date: '27 April 1911',
      title: 'Blessed Birth in Ludhiana',
      description: 'Born in the village of Bravi, District Ludhiana (East Punjab), into a noble Muslim family. From childhood, he displayed signs of profound contemplation, honesty, and spiritual devotion.',
    },
    {
      year: '1939',
      date: '1939 – 1946',
      title: 'Military Service & Total Renunciation',
      description: 'Served with distinction in the Royal Indian Army Engineers. In 1946, while on the threshold of major promotion, he resigned honorably to dedicate every breath exclusively to Allah and humanitarian service.',
    },
    {
      year: '1947',
      date: 'August 1947',
      title: 'Spiritual Mentorship & Migration',
      description: 'Pledged spiritual allegiance (Bay’ah) to his revered mentor, Hazrat Syed Amir-ul-Hassan Shah (R.A.). Following the partition of the subcontinent, he migrated to Pakistan, settling in Salarwala, Faisalabad.',
    },
    {
      year: '1954',
      date: '1954 – 1960',
      title: 'The Foundation of Dar-ul-Ehsan',
      description: 'Established Dar-ul-Ehsan (“The Abode of Excellence in Faith and Compassion”), transforming an uninhabited barren tract into a vibrant sanctuary of continuous prayer, hospitality, and healing.',
    },
    {
      year: '1970s',
      date: '1972 Onwards',
      title: 'Compilation of Makalat-e-Hikmat',
      description: 'Began penning Makalat-e-Hikmat, the celebrated encyclopedia of 30 volumes containing more than 10,000 aphorisms of divine wisdom, published and gifted without asking for any price.',
    },
    {
      year: '1978',
      date: '1978 – 1997',
      title: 'The Free Eye Camps & General Hospitals',
      description: 'Inaugurated the renowned Free Eye Camps and Free Hospitals, performing over 500,000 cataract surgeries, fitting intraocular lenses, providing medication, food, and lodging entirely free of cost without taking a single rupee in donations.',
    },
    {
      year: '1980s',
      date: '1980s Onwards',
      title: 'Worldwide Qur’an Kareem Distribution',
      description: 'Dispatched millions of copies of the Holy Qur’an and authentic translations to mosques, prisons, libraries, and seekers across continents completely free of charge.',
    },
    {
      year: '1997',
      date: '26 January 1997 (16 Ramadan 1417 AH)',
      title: 'Holy Transition (Wisaal)',
      description: 'Departed this temporal realm while fasting in the blessed month of Ramadan. Laid to rest at Dar-ul-Ehsan, where his shrine remains a center of peace, Zikr, and humanitarian relief.',
    },
  ];

  return (
    <div className="pt-28 pb-24 max-w-7xl mx-auto px-6 sm:px-10 lg:px-12">
      
      {/* 1. Header Banner */}
      <div className="max-w-3xl mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.1] text-xs font-semibold tracking-tightest text-[#c6ff33] mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Sacred Biography</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tightest text-white leading-tight">
          Life & Legacy of <br />
          <span className="text-shimmer">Hazrat Sufi Barkat Ali.</span>
        </h1>
        <p className="mt-4 text-sm sm:text-base text-white/60 leading-relaxed font-normal tracking-tight-custom">
          The embodiment of Tawakkul (Trust in Allah), pure Zikr-e-Ilahi, and unconditional compassion who revolutionized humanitarian service in the 20th century.
        </p>
      </div>

      {/* 2. Overview Profile Card */}
      <div className="paymo-card p-8 sm:p-12 mb-16 grid grid-cols-1 lg:grid-cols-3 gap-10 items-center">
        
        {/* Left Column */}
        <div className="flex flex-col items-start">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#10b981] via-[#c6ff33] to-[#e6b84a] p-[2px] mb-5">
            <div className="w-full h-full rounded-[22px] bg-black flex items-center justify-center text-3xl font-bold text-[#c6ff33]">
              د
            </div>
          </div>
          <h2 className="text-2xl font-bold tracking-tightest text-white">
            Hazrat Abu Anees Muhammad Barkat Ali
          </h2>
          <p className="text-sm text-[#c6ff33] font-mono mt-1">رحمۃ اللہ علیہ</p>
          <div className="mt-5 space-y-2.5 text-xs text-white/60 font-medium">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#c6ff33]" />
              <span>1911 – 1997 (85 Blessed Years)</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#c6ff33]" />
              <span>Dar-ul-Ehsan, Faisalabad, Pakistan</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-[#c6ff33]" />
              <span>Spiritual Lineage: Chishti & Qadiri Order</span>
            </div>
          </div>
        </div>

        {/* Right Columns */}
        <div className="lg:col-span-2 space-y-4 text-sm sm:text-[15px] text-white/75 leading-relaxed tracking-tight-custom">
          <p className="text-base sm:text-lg font-medium text-white border-l-2 border-[#c6ff33] pl-4 py-1">
            &ldquo;No price on divine wisdom; no price on humanitarian relief. Everything at Dar-ul-Ehsan is given freely for the love of Allah Almighty.&rdquo;
          </p>
          <p>
            Hazrat Sufi Abu Anees Muhammad Barkat Ali (R.A.) was a world-renowned Sufi master, mystic, humanitarian, and prolific Islamic author. His life was an uninterrupted symphony of <strong>Zikr-e-Ilahi</strong> (remembrance of Allah) and <strong>Khidmat-e-Khalq</strong> (service to creation).
          </p>
          <p>
            Unlike modern institutional charity, Hazrat Baba Ji strictly observed the principle of <em>Tawakkul</em>: he never solicited donations, never organized fundraisers, and never accepted grants. Everything—from multi-story hospital complexes to dining halls (Langar)—was provided solely through divine grace and sincere voluntary effort.
          </p>
          <div className="pt-3 flex flex-wrap gap-2 text-xs">
            <span className="px-3 py-1 rounded-full bg-white/[0.06] text-[#c6ff33] border border-white/[0.1] font-mono">
              ✦ 30 Volumes of Makalat
            </span>
            <span className="px-3 py-1 rounded-full bg-white/[0.06] text-white border border-white/[0.1] font-mono">
              ✦ 500,000+ Eye Surgeries
            </span>
            <span className="px-3 py-1 rounded-full bg-white/[0.06] text-emerald-400 border border-white/[0.1] font-mono">
              ✦ Global Free Qur’an
            </span>
          </div>
        </div>

      </div>

      {/* 3. The Miracle of the Free Eye Camps */}
      <div className="paymo-card p-8 sm:p-12 mb-16 border-[#c6ff33]/30">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.1] text-xs font-semibold tracking-tightest text-[#c6ff33] mb-4">
            <Eye className="w-3.5 h-3.5" />
            <span>Humanitarian Marvel</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tightest text-white mb-4">
            The Free Eye Hospitals of <span className="text-shimmer">Camp Dar-ul-Ehsan.</span>
          </h2>
          <p className="text-sm sm:text-base text-white/70 leading-relaxed tracking-tight-custom mb-6">
            In the 1970s, seeing the agony of poor villagers going blind from treatable cataracts because they could not afford surgery, Hazrat Baba Ji established the bi-annual Free Eye Camps. Eminent surgeons volunteered under his guidance.
          </p>
          <ul className="space-y-3 text-xs sm:text-sm text-white/80 mb-6">
            <li className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-[#c6ff33] flex-shrink-0" />
              <span>Over 50,000 free operations performed per annum during peak seasons.</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-[#c6ff33] flex-shrink-0" />
              <span>100% complimentary high-grade intraocular lenses, post-op antibiotics, and glasses.</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-[#c6ff33] flex-shrink-0" />
              <span>Nutritious meals, tea, lodging, and transport provided free of charge to patients and their families.</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-[#c6ff33] flex-shrink-0" />
              <span>Universal compassion: open to people of every religion, creed, and background.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* 4. Chronological Interactive Timeline */}
      <div className="mb-20">
        <div className="max-w-2xl mb-12">
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tightest text-white">
            Chronological <span className="text-shimmer">Milestones.</span>
          </h2>
          <p className="text-xs sm:text-sm text-white/50 mt-1">
            Key epochs in the life and mission of Hazrat Baba Ji (1911–1997)
          </p>
        </div>

        <div className="relative border-l border-white/[0.12] max-w-4xl pl-6 sm:pl-10 space-y-8">
          {timelineEvents.map((event, idx) => (
            <div key={idx} className="relative group">
              <div className="absolute -left-[31px] sm:-left-[47px] top-2 w-3.5 h-3.5 rounded-full bg-[#c6ff33] border-4 border-black group-hover:scale-125 transition-transform" />
              
              <div className="paymo-card p-6 group-hover:border-[#c6ff33]/40 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                  <span className="text-xs font-mono font-bold text-[#c6ff33]">
                    {event.date}
                  </span>
                  <span className="text-xs text-white/40 font-mono">
                    Year {event.year}
                  </span>
                </div>
                <h3 className="text-lg font-bold tracking-tightest text-white mt-1 mb-2">
                  {event.title}
                </h3>
                <p className="text-xs sm:text-sm text-white/70 leading-relaxed tracking-tight-custom">
                  {event.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Call to Action */}
      <div className="border-t border-white/[0.08] pt-12 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold tracking-tightest text-white">
            Explore the teachings and visual heritage
          </h3>
          <p className="text-xs text-white/50 mt-0.5">
            Access the quotation feeds or view the historical photographs.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/makalat" className="btn-lime">
            <span>Read Makalat</span>
          </Link>
          <Link href="/gallery" className="btn-dark">
            <span>Open Gallery</span>
          </Link>
        </div>
      </div>

    </div>
  );
}
