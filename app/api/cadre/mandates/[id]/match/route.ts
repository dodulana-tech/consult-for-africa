import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Compute a basic match score (0-100) based on multiple factors
function computeMatchScore(
  professional: {
    cadre: string;
    subSpecialty: string | null;
    yearsOfExperience: number | null;
    state: string | null;
    city: string | null;
    availability: string | null;
    qualifications: { name: string }[];
  },
  mandate: {
    cadre: string;
    subSpecialty: string | null;
    minYearsExperience: number | null;
    locationState: string | null;
    locationCity: string | null;
    isRemoteOk: boolean;
    requiredQualifications: string[];
    preferredQualifications: string[];
  }
): { score: number; explanation: string } {
  let score = 0;
  const reasons: string[] = [];

  // Cadre match (30 points) - must match, this is a filter too
  if (professional.cadre === mandate.cadre) {
    score += 30;
    reasons.push("Cadre match");

    // Sub-specialty bonus (10 points)
    if (
      mandate.subSpecialty &&
      professional.subSpecialty &&
      professional.subSpecialty.toLowerCase().includes(mandate.subSpecialty.toLowerCase())
    ) {
      score += 10;
      reasons.push("Sub-specialty match");
    } else if (!mandate.subSpecialty) {
      score += 5; // No sub-specialty required, partial credit
    }
  }

  // Experience match (20 points)
  if (mandate.minYearsExperience != null && professional.yearsOfExperience != null) {
    if (professional.yearsOfExperience >= mandate.minYearsExperience) {
      score += 20;
      reasons.push(`${professional.yearsOfExperience} yrs experience meets ${mandate.minYearsExperience} yr requirement`);
    } else {
      // Partial credit for close match
      const ratio = professional.yearsOfExperience / mandate.minYearsExperience;
      const partial = Math.round(ratio * 15);
      score += partial;
      reasons.push(
        `${professional.yearsOfExperience} yrs experience (${mandate.minYearsExperience} required)`
      );
    }
  } else if (mandate.minYearsExperience == null) {
    score += 15; // No requirement, partial credit
  }

  // Location match (20 points)
  if (mandate.isRemoteOk) {
    score += 20;
    reasons.push("Remote OK");
  } else if (mandate.locationState) {
    if (
      professional.state &&
      professional.state.toLowerCase() === mandate.locationState.toLowerCase()
    ) {
      score += 15;
      reasons.push("State match");

      if (
        mandate.locationCity &&
        professional.city &&
        professional.city.toLowerCase() === mandate.locationCity.toLowerCase()
      ) {
        score += 5;
        reasons.push("City match");
      }
    } else {
      reasons.push("Location mismatch");
    }
  } else {
    score += 10; // No location requirement
  }

  // Availability match (10 points)
  if (professional.availability === "ACTIVELY_LOOKING") {
    score += 10;
    reasons.push("Actively looking");
  } else if (professional.availability === "OPEN_TO_OFFERS") {
    score += 7;
    reasons.push("Open to offers");
  } else if (professional.availability === "DOING_LOCUM") {
    score += 5;
    reasons.push("Doing locum");
  } else {
    reasons.push("Not actively looking");
  }

  // Qualification match (10 points)
  if (mandate.requiredQualifications.length > 0) {
    const profQuals = professional.qualifications.map((q) => q.name.toLowerCase());
    const matchedRequired = mandate.requiredQualifications.filter((rq) =>
      profQuals.some((pq) => pq.includes(rq.toLowerCase()))
    );
    const reqRatio = matchedRequired.length / mandate.requiredQualifications.length;
    score += Math.round(reqRatio * 7);
    if (matchedRequired.length > 0) {
      reasons.push(`${matchedRequired.length}/${mandate.requiredQualifications.length} required quals`);
    }
  } else {
    score += 5;
  }

  if (mandate.preferredQualifications.length > 0) {
    const profQuals = professional.qualifications.map((q) => q.name.toLowerCase());
    const matchedPreferred = mandate.preferredQualifications.filter((pq) =>
      profQuals.some((prq) => prq.includes(pq.toLowerCase()))
    );
    if (matchedPreferred.length > 0) {
      score += 3;
      reasons.push(`${matchedPreferred.length} preferred quals`);
    }
  }

  // Cap at 100
  score = Math.min(score, 100);

  return {
    score,
    explanation: reasons.join(". "),
  };
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const mandate = await prisma.cadreMandate.findUnique({
      where: { id },
    });

    if (!mandate) {
      return NextResponse.json({ error: "Mandate not found" }, { status: 404 });
    }

    // Find candidate professionals matching the cadre
    const professionals = await prisma.cadreProfessional.findMany({
      where: {
        cadre: mandate.cadre,
        accountStatus: { not: "SUSPENDED" },
      },
      include: {
        qualifications: { select: { name: true } },
      },
    });

    // Get existing match IDs to avoid duplicates
    const existingMatches = await prisma.cadreMandateMatch.findMany({
      where: { mandateId: id },
      select: { professionalId: true },
    });
    const existingIds = new Set(existingMatches.map((m) => m.professionalId));

    // Score and filter
    const scored = professionals
      .filter((p) => !existingIds.has(p.id))
      .map((p) => {
        const { score, explanation } = computeMatchScore(p, mandate);
        return { professionalId: p.id, score, explanation };
      })
      .filter((m) => m.score >= 20) // minimum threshold
      .sort((a, b) => b.score - a.score)
      .slice(0, 50); // top 50

    // Create match records
    if (scored.length > 0) {
      await prisma.cadreMandateMatch.createMany({
        data: scored.map((m, i) => ({
          mandateId: id,
          professionalId: m.professionalId,
          matchScore: m.score,
          matchExplanation: m.explanation,
          rank: i + 1,
          status: "MATCHED",
        })),
        skipDuplicates: true,
      });
    }

    // Update mandate status to SOURCING if currently OPEN
    if (mandate.status === "OPEN") {
      await prisma.cadreMandate.update({
        where: { id },
        data: { status: "SOURCING" },
      });
    }

    return NextResponse.json({
      matchCount: scored.length,
      topScore: scored[0]?.score ?? 0,
    });
  } catch (error) {
    console.error("Error matching mandate:", error);
    return NextResponse.json({ error: "Failed to find matches" }, { status: 500 });
  }
}
