import { sendCadreEmail } from "@/lib/cadreEmail";
import { notifySystem } from "@/lib/cadreHealth/notifications";

const BASE_URL = process.env.NEXTAUTH_URL || process.env.BASE_URL || "https://oncadre.com";

interface StageContext {
  firstName: string;
  interviewDate: Date | null;
}

interface AutomationConfig {
  email: {
    subject: string;
    heading: string;
    body: string;
    ctaText: string;
    ctaHref: string;
    footer?: string;
  };
  notification: {
    title: string;
    message: string;
    link: string;
  };
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateTime(date: Date): string {
  return `${formatDate(date)} at ${date.toLocaleTimeString("en-NG", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })}`;
}

const STAGE_AUTOMATIONS: Record<string, (ctx: StageContext) => AutomationConfig> = {
  SHORTLISTED: ({ firstName }) => ({
    email: {
      subject: "CadreHealth - You Have Been Shortlisted",
      heading: `Congratulations, ${firstName}! You have been shortlisted`,
      body: "The CadreHealth recruitment team has reviewed your profile and shortlisted you for further consideration. To move forward, please ensure your CV and professional credentials are uploaded to your CadreHealth profile. This includes your practicing license, registration certificate, and any specialist qualifications. Complete submissions are prioritised.",
      ctaText: "Upload Your Documents",
      ctaHref: `${BASE_URL}/oncadre/documents`,
      footer: "If you have already uploaded your documents, no action is needed. We will be in touch with next steps shortly.",
    },
    notification: {
      title: "You have been shortlisted",
      message: "You have been shortlisted by the CadreHealth recruitment team. Please upload your CV and credentials to proceed.",
      link: "/oncadre/documents",
    },
  }),

  INTERVIEW_SCHEDULED: ({ firstName, interviewDate }) => {
    const dateStr = interviewDate ? formatDateTime(interviewDate) : "a date to be confirmed";
    return {
      email: {
        subject: "CadreHealth - Your Interview Has Been Scheduled",
        heading: `Interview Scheduled, ${firstName}`,
        body: `Your interview with the CadreHealth recruitment team has been scheduled for ${dateStr}. Please ensure you are available at the scheduled time. You may be contacted via phone or email with joining details closer to the date. If you need to reschedule, please reply to this email as soon as possible.`,
        ctaText: "View Your Profile",
        ctaHref: `${BASE_URL}/oncadre/dashboard`,
        footer: `Interview date: ${dateStr}. Please keep this time available.`,
      },
      notification: {
        title: "Interview scheduled",
        message: `Your interview has been scheduled for ${dateStr}. Please be available at the scheduled time.`,
        link: "/oncadre/dashboard",
      },
    };
  },

  INTERVIEW_DONE: ({ firstName }) => ({
    email: {
      subject: "CadreHealth - Thank You for Your Interview",
      heading: `Thank you for your time, ${firstName}`,
      body: "We appreciate you taking the time to interview with the CadreHealth recruitment team. Our team is currently reviewing all candidates, and we will be in touch with an update soon. In the meantime, please ensure your profile is fully up to date.",
      ctaText: "Update Your Profile",
      ctaHref: `${BASE_URL}/oncadre/profile`,
      footer: "We aim to provide feedback within 5 to 10 working days of your interview.",
    },
    notification: {
      title: "Interview completed",
      message: "Thank you for completing your interview. We will follow up with next steps soon.",
      link: "/oncadre/dashboard",
    },
  }),

  OFFER: ({ firstName }) => ({
    email: {
      subject: "CadreHealth - You Have Received an Offer",
      heading: `Great news, ${firstName}!`,
      body: "We are pleased to inform you that the CadreHealth recruitment team would like to extend an offer to you. Please log in to your CadreHealth portal to review the details and next steps. If you have any questions, do not hesitate to reach out to our recruitment team.",
      ctaText: "Review Your Offer",
      ctaHref: `${BASE_URL}/oncadre/dashboard`,
      footer: "Please respond within 5 working days so we can proceed with your placement.",
    },
    notification: {
      title: "You have received an offer",
      message: "Congratulations! You have received an offer from CadreHealth. Log in to review the details.",
      link: "/oncadre/dashboard",
    },
  }),

  PLACED: ({ firstName }) => ({
    email: {
      subject: "CadreHealth - Welcome Aboard",
      heading: `Welcome to the team, ${firstName}!`,
      body: "Your placement with CadreHealth is now confirmed. We are delighted to have you on board. Our team will be in touch shortly with onboarding details, including your start date and any documentation required. Please keep your profile and credentials current.",
      ctaText: "Go to Your Dashboard",
      ctaHref: `${BASE_URL}/oncadre/dashboard`,
      footer: "If you have any questions about your placement, please contact the CadreHealth recruitment team.",
    },
    notification: {
      title: "Placement confirmed",
      message: "Your placement has been confirmed. Welcome aboard! Check your dashboard for onboarding details.",
      link: "/oncadre/dashboard",
    },
  }),

  REJECTED: ({ firstName }) => ({
    email: {
      subject: "CadreHealth - Application Update",
      heading: `Update on your application, ${firstName}`,
      body: "Thank you for your interest in opportunities through CadreHealth. After careful consideration, we are unable to move forward with your application at this time. This does not reflect on your qualifications, and we encourage you to keep your profile active. New opportunities arise regularly, and we may reach out again in the future.",
      ctaText: "Keep Your Profile Updated",
      ctaHref: `${BASE_URL}/oncadre/profile`,
      footer: "You will continue to receive relevant opportunity notifications on CadreHealth.",
    },
    notification: {
      title: "Application update",
      message: "We have an update regarding your application. Please check your email for details.",
      link: "/oncadre/dashboard",
    },
  }),
};

export interface AutomationResult {
  emailSent: boolean;
  notificationSent: boolean;
  emailError?: string;
}

export async function handleRecruitmentStageChange({
  professionalId,
  previousStage,
  newStage,
  interviewDate,
  professional,
}: {
  professionalId: string;
  previousStage: string | null;
  newStage: string | null;
  interviewDate: Date | null;
  professional: { firstName: string; email: string };
}): Promise<AutomationResult> {
  // No automation if stage unchanged, cleared, or set to SCREENING
  if (!newStage || newStage === previousStage || newStage === "SCREENING") {
    return { emailSent: false, notificationSent: false };
  }

  const automationFn = STAGE_AUTOMATIONS[newStage];
  if (!automationFn) {
    return { emailSent: false, notificationSent: false };
  }

  const config = automationFn({
    firstName: professional.firstName,
    interviewDate,
  });

  let emailSent = false;
  let emailError: string | undefined;
  let notificationSent = false;

  // Send email (skip if no valid email)
  if (professional.email && !professional.email.includes("@cadrehealth.system")) {
    try {
      await sendCadreEmail({
        to: professional.email,
        ...config.email,
      });
      emailSent = true;
    } catch (err) {
      emailError = err instanceof Error ? err.message : "Email send failed";
      console.error(`[recruitmentPipeline] Email failed for ${professionalId}:`, err);
    }
  } else {
    emailError = "No valid email on file";
  }

  // Send in-app notification
  try {
    await notifySystem(
      professionalId,
      config.notification.title,
      config.notification.message,
      config.notification.link
    );
    notificationSent = true;
  } catch (err) {
    console.error(`[recruitmentPipeline] Notification failed for ${professionalId}:`, err);
  }

  return { emailSent, notificationSent, emailError };
}
