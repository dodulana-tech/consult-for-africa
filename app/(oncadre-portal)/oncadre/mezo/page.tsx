import { redirect } from "next/navigation";
import { getCadreSession } from "@/lib/cadreAuth";
import { prisma } from "@/lib/prisma";
import { DoorOpen, Users, Wallet } from "lucide-react";
import MezoGate from "./MezoGate";

export const metadata = {
  title: "Private practice with Mezo",
};

const TEAL = "#0A7B6E";
const NAVY = "#0B1F3A";

/** Mezo runs on the MDCN register. See the note in the survey API route. */
const MEZO_CADRES = new Set(["MEDICINE", "DENTISTRY"]);

export default async function MezoPage() {
  const session = await getCadreSession();
  if (!session) redirect("/oncadre/login");

  const professional = await prisma.cadreProfessional.findUnique({
    where: { id: session.sub },
    select: { cadre: true, yearsOfExperience: true, mezoInterest: true },
  });
  if (!professional) redirect("/oncadre/register");

  const eligible = MEZO_CADRES.has(professional.cadre);

  return (
    <div className="space-y-10">
      {/* Hero */}
      <div
        className="relative overflow-hidden rounded-2xl px-6 py-10 sm:px-10 sm:py-14"
        style={{
          background: `linear-gradient(135deg, ${NAVY} 0%, #10314F 55%, ${NAVY} 100%)`,
          boxShadow: "0 4px 28px rgba(11,31,58,0.22)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 55% 85% at 88% 15%, rgba(0,196,163,0.18) 0%, transparent 62%)",
          }}
        />
        <div className="relative max-w-2xl">
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.22em]"
            style={{ color: "#00C4A3" }}
          >
            Mezo Health
          </p>
          <h1
            className="mt-3 font-bold leading-[1.1] text-white"
            style={{ fontSize: "clamp(1.9rem, 4.2vw, 2.9rem)" }}
          >
            Your own practice, without building one.
          </h1>
          <p className="mt-5 text-[16px] leading-relaxed" style={{ color: "rgba(255,255,255,0.72)" }}>
            {professional.yearsOfExperience
              ? `You have spent ${professional.yearsOfExperience} years building your reputation inside other people's institutions. `
              : "You have spent your career building your reputation inside other people's institutions. "}
            Mezo is where you build your own. A licensed specialist network with clinics, theatres,
            wards and physio bays, a patient base already searching for your specialty, and the whole
            revenue cycle behind it. You can consult, operate and admit under your own name from the
            first week, without raising the capital a building takes.
          </p>
        </div>
      </div>

      {/* What it actually is */}
      <div className="grid gap-5 md:grid-cols-3">
        <Pillar
          icon={<DoorOpen className="h-5 w-5" style={{ color: TEAL }} />}
          title="Consult, operate, admit"
          body="Clinics, day and main theatres, inpatient beds and physio bays, with the equipment and the clinical staff around them. A consultant can run a whole episode of care here, not just an outpatient list."
        />
        <Pillar
          icon={<Users className="h-5 w-5" style={{ color: TEAL }} />}
          title="Patients, from day one"
          body="A patient base already searching the network by specialty and city, arriving with the fee agreed. You build a book of your own patients from the first week instead of waiting years for word to travel."
        />
        <Pillar
          icon={<Wallet className="h-5 w-5" style={{ color: TEAL }} />}
          title="HMO panels you cannot reach alone"
          body="Network HMO agreements, negotiated on the volume of everyone practising here rather than on yours. Accreditation handled, fees collected at booking, claims tracked, and up to 80% advanced before the HMO settles."
        />
      </div>

      {/* Gate */}
      <div className="rounded-2xl border bg-white p-6 sm:p-8" style={{ borderColor: "#E8EBF0" }}>
        {eligible ? (
          <MezoGate
            answered={!!professional.mezoInterest}
            claimUrl={professional.mezoInterest?.mezoClaimUrl ?? null}
            mezoStatus={professional.mezoInterest?.mezoStatus ?? null}
          />
        ) : (
          <div>
            <h2 className="text-2xl font-bold" style={{ color: NAVY }}>
              Not yet open to your cadre
            </h2>
            <p className="mt-2 max-w-2xl text-[15px] leading-relaxed" style={{ color: "#4B5563" }}>
              Mezo places run on the MDCN register, so the first rooms are open to doctors and
              dentists. The model works for other cadres too and we intend to get there. Nothing is
              required from you now.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Pillar({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "#E8EBF0" }}>
      <div
        className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl"
        style={{ background: "rgba(10,123,110,0.10)" }}
      >
        {icon}
      </div>
      <h3 className="text-[17px] font-bold" style={{ color: NAVY }}>
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed" style={{ color: "#4B5563" }}>
        {body}
      </p>
    </div>
  );
}
