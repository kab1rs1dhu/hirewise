'use server';

import { db } from "@/firebase/admin";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { feedbackSchema } from "@/constants";

const EMAILJS_ENDPOINT = "https://api.emailjs.com/api/v1.0/email/send";

interface FeedbackEmailSummary {
    userId: string;
    interviewId: string;
    feedbackId: string;
    totalScore: number;
    finalAssessment: string;
    categoryScores: Array<{
        name: string;
        score: number;
        comment: string;
    }>;
}

export async function getInterviewsByUserId(userId: string): Promise<Interview[] | null> {
    const interviews = await db
        .collection('interviews')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

    return interviews.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
    })) as Interview[];
}

export async function getLatestInterviews(params: GetLatestInterviewsParams): Promise<Interview[] | null> {
    const { userId, limit = 20 } = params;

    const interviews = await db
        .collection('interviews')
        .orderBy('createdAt', 'desc')
        .where('finalized', '==', true)
        .where('userId', '!=', userId)
        .limit(limit)
        .get();

    return interviews.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
    })) as Interview[];
}

export async function getInterviewById(id: string): Promise<Interview | null> {
    const interview = await db
        .collection('interviews')
        .doc(id)
        .get();

    return interview.data() as Interview | null;
}

export async function createFeedback(params: CreateFeedbackParams) {
    const { interviewId, userId, transcript } = params;

    try {
        const formattedTranscript = transcript
            .map((sentence: { role: string; content: string; }) => (
                `- ${sentence.role}: ${sentence.content}\n`
            )).join('');

            console.log('Formatted Transcript:', formattedTranscript);

        const { object: { totalScore, categoryScores, strengths, areasForImprovement, finalAssessment } } = await generateObject({
            model: google('gemini-2.0-flash-001', {
                structuredOutputs: true,
            }),
            schema: feedbackSchema,
            prompt: `You are an AI interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories. Be thorough and detailed in your analysis. Don't be lenient with the candidate. If there are mistakes or areas for improvement, point them out.
        Transcript:
        ${formattedTranscript}

        Please score the candidate from 0 to 100 in the following areas. Do not add categories other than the ones provided:
        - Communication Skills: Clarity, articulation, structured responses.
        - Technical Knowledge: Understanding of key concepts for the role.
        - Problem Solving: Ability to analyze problems and propose solutions.
        - Cultural Fit: Alignment with company values and job role.
        - Confidence and Clarity: Confidence in responses, engagement, and clarity.
        `,
            system:
                "You are a professional interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories",
        });

        console.log('Generated Feedback:', { totalScore, categoryScores, strengths, areasForImprovement, finalAssessment });

        const feedback = await db.collection('feedback').add({
            interviewId,
            userId,
            totalScore,
            categoryScores,
            strengths,
            areasForImprovement,
            finalAssessment,
            createdAt: new Date().toISOString()
        });

        await sendFeedbackSummaryEmail({
            userId,
            interviewId,
            feedbackId: feedback.id,
            totalScore,
            finalAssessment,
            categoryScores,
        });

        return {
            success: true,
            feedbackId: feedback.id
        }
    } catch (e) {
        console.error("error in generating feedback general.action: ", e);

        return { success: false }
    }
}

export async function getFeedbackByInterviewId(params: GetFeedbackByInterviewIdParams): Promise<Feedback | null> {
    const { interviewId, userId } = params;

    const feedback = await db
        .collection('feedback')
        .where('interviewId', '==', interviewId)
        .where('userId', '==', userId)
        .limit(1)
        .get();

    if(feedback.empty) return null;

    const feedbackDoc = feedback.docs[0];

    return {
        id: feedbackDoc.id, ...feedbackDoc.data()
,    } as Feedback;
}

async function sendFeedbackSummaryEmail(summary: FeedbackEmailSummary) {
    const serviceId = process.env.EMAILJS_SERVICE_ID;
    const templateId = process.env.EMAILJS_TEMPLATE_ID;
    const publicKey = process.env.EMAILJS_PUBLIC_KEY;
    const privateKey = process.env.EMAILJS_PRIVATE_KEY;

    if (!serviceId || !templateId || !publicKey || !privateKey) {
        console.warn("EmailJS environment variables are not fully configured. Skipping email send.");
        return;
    }

    const userDoc = await db.collection('users').doc(summary.userId).get();
    const userData = userDoc.data();

    if (!userDoc.exists || !userData?.email) {
        console.warn(`Unable to send email summary. User not found or email missing for userId: ${summary.userId}`);
        return;
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const categoryBreakdown = summary.categoryScores
        .map((category) => `${category.name}: ${category.score}/100 — ${category.comment}`)
        .join("\n");

    const templateParams = {
        recipient_email: userData.email,
        recipient_name: userData.name ?? "there",
        total_score: `${summary.totalScore}`,
        final_assessment: summary.finalAssessment,
        category_breakdown: categoryBreakdown,
        feedback_url: `${appUrl}/interview/${summary.interviewId}/feedback`,
        feedback_id: summary.feedbackId,
    };

    try {
        const response = await fetch(EMAILJS_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${privateKey}`,
            },
            body: JSON.stringify({
                service_id: serviceId,
                template_id: templateId,
                user_id: publicKey,
                template_params: templateParams,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => "Unknown error");
            throw new Error(`EmailJS responded with ${response.status}: ${errorText}`);
        }

        console.log(`Feedback summary email sent to ${userData.email}`);
    } catch (error) {
        console.error("Failed to send feedback summary email:", error);
    }
}
