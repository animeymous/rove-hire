import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/lib/models/User';
import Job from '@/lib/models/Job';
import Candidate from '@/lib/models/Candidate';
import TimelineEvent from '@/lib/models/TimelineEvent';
import Interview from '@/lib/models/Interview';
import OfferDocument from '@/lib/models/OfferDocument';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    await connectToDatabase();

    console.log('🌱 Starting seed...');

    // Clear existing data (optional - comment out if you want to keep existing data)
    await Candidate.deleteMany({});
    await Job.deleteMany({});
    await TimelineEvent.deleteMany({});
    await Interview.deleteMany({});
    await OfferDocument.deleteMany({});
    console.log('🧹 Cleared existing data');

    // ============================================
    // 1. CREATE SAMPLE JOBS (3 jobs)
    // ============================================
    const jobs = await Job.create([
      {
        title: 'Senior Full-Stack Developer',
        description: 'We are looking for an experienced full-stack developer with expertise in React, Node.js, and MongoDB. You will lead a team of developers and architect scalable solutions for our growing product.',
        skills: ['React', 'Node.js', 'MongoDB', 'TypeScript', 'AWS'],
        status: 'Open',
      },
      {
        title: 'Product Designer',
        description: 'Seeking a creative product designer with experience in UI/UX and design systems. You will shape the user experience of our products and work closely with product and engineering teams.',
        skills: ['Figma', 'UI/UX', 'Design Systems', 'Prototyping', 'User Research'],
        status: 'Open',
      },
      {
        title: 'DevOps Engineer',
        description: 'Looking for a DevOps engineer to manage our cloud infrastructure and CI/CD pipelines. Experience with AWS, Docker, and Kubernetes is required.',
        skills: ['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Terraform'],
        status: 'Closed',
      },
    ]);

    console.log(`📋 Created ${jobs.length} jobs`);

    // ============================================
    // 2. CREATE SAMPLE CANDIDATES (5 candidates)
    // ============================================
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    // Helper to create dates
    const daysAgo = (days: number) => {
      const date = new Date();
      date.setDate(date.getDate() - days);
      return date;
    };

    // Candidate 1: Applied
    const candidate1 = await Candidate.create({
      name: 'Alice Johnson',
      email: 'alice.johnson@example.com',
      jobId: jobs[0]._id,
      status: 'Applied',
      resumeUrl: 'https://example.com/resume-alice.pdf',
      magicLinkToken: uuidv4(),
      magicLinkExpiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      isMagicLinkUsed: false,
      interviewRound: 'Screening',
      interviewCount: 0,
      screeningPassed: false,
      createdAt: daysAgo(2),
      updatedAt: daysAgo(2),
    });

    await TimelineEvent.create({
      candidateId: candidate1._id,
      type: 'APPLIED',
      description: `Candidate applied for ${jobs[0].title}`,
      metadata: { jobTitle: jobs[0].title },
      createdAt: daysAgo(2),
    });

    // Candidate 2: Form Submitted
    const candidate2 = await Candidate.create({
      name: 'Bob Smith',
      email: 'bob.smith@example.com',
      jobId: jobs[0]._id,
      status: 'Form Submitted',
      resumeUrl: 'https://example.com/resume-bob.pdf',
      phone: '+1 (555) 123-4567',
      location: 'San Francisco, CA',
      currentRole: 'Software Engineer at TechCorp',
      noticePeriod: '2 Weeks',
      salaryExpectation: '$150,000',
      linkedinUrl: 'https://linkedin.com/in/bobsmith',
      magicLinkToken: uuidv4(),
      magicLinkExpiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      isMagicLinkUsed: true,
      interviewRound: 'Screening',
      interviewCount: 0,
      screeningPassed: false,
      createdAt: daysAgo(5),
      updatedAt: daysAgo(4),
    });

    await TimelineEvent.create({
      candidateId: candidate2._id,
      type: 'APPLIED',
      description: `Candidate applied for ${jobs[0].title}`,
      metadata: { jobTitle: jobs[0].title },
      createdAt: daysAgo(5),
    });

    await TimelineEvent.create({
      candidateId: candidate2._id,
      type: 'FORM_SUBMITTED',
      description: 'Candidate completed the application form',
      metadata: {
        phone: '+1 (555) 123-4567',
        location: 'San Francisco, CA',
        currentRole: 'Software Engineer at TechCorp',
        noticePeriod: '2 Weeks',
        salaryExpectation: '$150,000',
        linkedinUrl: 'https://linkedin.com/in/bobsmith',
      },
      createdAt: daysAgo(4),
    });

    // Candidate 3: Interview Scheduled with feedback
    const candidate3 = await Candidate.create({
      name: 'Carol Davis',
      email: 'carol.davis@example.com',
      jobId: jobs[1]._id,
      status: 'Interview Scheduled',
      resumeUrl: 'https://example.com/resume-carol.pdf',
      phone: '+1 (555) 987-6543',
      location: 'New York, NY',
      currentRole: 'Product Designer at DesignStudio',
      noticePeriod: '1 Month',
      salaryExpectation: '$130,000',
      linkedinUrl: 'https://linkedin.com/in/caroldavis',
      magicLinkToken: uuidv4(),
      magicLinkExpiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      isMagicLinkUsed: true,
      interviewRound: 'Screening',
      interviewCount: 1,
      screeningPassed: false,
      createdAt: daysAgo(7),
      updatedAt: daysAgo(1),
    });

    // Timeline events for candidate 3
    await TimelineEvent.create({
      candidateId: candidate3._id,
      type: 'APPLIED',
      description: `Candidate applied for ${jobs[1].title}`,
      metadata: { jobTitle: jobs[1].title },
      createdAt: daysAgo(7),
    });

    await TimelineEvent.create({
      candidateId: candidate3._id,
      type: 'FORM_SUBMITTED',
      description: 'Candidate completed the application form',
      metadata: {
        phone: '+1 (555) 987-6543',
        location: 'New York, NY',
        currentRole: 'Product Designer at DesignStudio',
        noticePeriod: '1 Month',
        salaryExpectation: '$130,000',
        linkedinUrl: 'https://linkedin.com/in/caroldavis',
      },
      createdAt: daysAgo(6),
    });

    // Create interview for candidate 3
    const interview3 = await Interview.create({
      candidateId: candidate3._id,
      date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      time: '10:00 AM',
      type: 'Screening',
      interviewerName: 'Sarah Wilson',
      notes: 'Initial screening interview',
      round: 'Screening',
      status: 'Scheduled',
      isCompleted: false,
      createdAt: daysAgo(1),
      updatedAt: daysAgo(1),
    });

    await TimelineEvent.create({
      candidateId: candidate3._id,
      type: 'INTERVIEW_SCHEDULED',
      description: `Screening interview scheduled for Carol Davis with Sarah Wilson`,
      metadata: {
        interviewId: interview3._id,
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        time: '10:00 AM',
        type: 'Screening',
        interviewerName: 'Sarah Wilson',
        round: 'Screening',
      },
      createdAt: daysAgo(1),
    });

    // Candidate 4: Offer Sent with downloadable PDFs
    const candidate4 = await Candidate.create({
      name: 'David Wilson',
      email: 'david.wilson@example.com',
      jobId: jobs[0]._id,
      status: 'Offer Sent',
      resumeUrl: 'https://example.com/resume-david.pdf',
      phone: '+1 (555) 456-7890',
      location: 'Austin, TX',
      currentRole: 'Lead Developer at BigTech',
      noticePeriod: '2 Weeks',
      salaryExpectation: '$170,000',
      linkedinUrl: 'https://linkedin.com/in/davidwilson',
      magicLinkToken: uuidv4(),
      magicLinkExpiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      isMagicLinkUsed: true,
      interviewRound: 'Completed',
      interviewCount: 2,
      screeningPassed: true,
      createdAt: daysAgo(10),
      updatedAt: daysAgo(1),
    });

    // Timeline for candidate 4
    await TimelineEvent.create({
      candidateId: candidate4._id,
      type: 'APPLIED',
      description: `Candidate applied for ${jobs[0].title}`,
      metadata: { jobTitle: jobs[0].title },
      createdAt: daysAgo(10),
    });

    await TimelineEvent.create({
      candidateId: candidate4._id,
      type: 'FORM_SUBMITTED',
      description: 'Candidate completed the application form',
      metadata: {
        phone: '+1 (555) 456-7890',
        location: 'Austin, TX',
        currentRole: 'Lead Developer at BigTech',
        noticePeriod: '2 Weeks',
        salaryExpectation: '$170,000',
        linkedinUrl: 'https://linkedin.com/in/davidwilson',
      },
      createdAt: daysAgo(9),
    });

    // Create interviews for candidate 4
    const screeningInterview = await Interview.create({
      candidateId: candidate4._id,
      date: daysAgo(7),
      time: '2:00 PM',
      type: 'Screening',
      interviewerName: 'John Manager',
      notes: 'Screening interview',
      round: 'Screening',
      status: 'Completed',
      isCompleted: true,
      feedback: 'Excellent candidate, strong technical skills',
      recommendation: 'Pass',
      createdAt: daysAgo(8),
      updatedAt: daysAgo(7),
    });

    await TimelineEvent.create({
      candidateId: candidate4._id,
      type: 'INTERVIEW_SCHEDULED',
      description: `Screening interview scheduled for David Wilson with John Manager`,
      metadata: {
        interviewId: screeningInterview._id,
        date: daysAgo(7),
        time: '2:00 PM',
        type: 'Screening',
        interviewerName: 'John Manager',
        round: 'Screening',
      },
      createdAt: daysAgo(8),
    });

    await TimelineEvent.create({
      candidateId: candidate4._id,
      type: 'INTERVIEW_COMPLETED',
      description: `✅ Screening interview PASSED for David Wilson. Ready for Technical round.`,
      metadata: {
        interviewId: screeningInterview._id,
        feedback: 'Excellent candidate, strong technical skills',
        recommendation: 'Pass',
        round: 'Screening',
        nextRound: 'Technical',
      },
      createdAt: daysAgo(7),
    });

    const technicalInterview = await Interview.create({
      candidateId: candidate4._id,
      date: daysAgo(5),
      time: '11:00 AM',
      type: 'Technical',
      interviewerName: 'Tech Lead',
      notes: 'Technical interview',
      round: 'Technical',
      status: 'Completed',
      isCompleted: true,
      feedback: 'Strong technical skills, good cultural fit',
      recommendation: 'Ready to Offer',
      createdAt: daysAgo(6),
      updatedAt: daysAgo(5),
    });

    await TimelineEvent.create({
      candidateId: candidate4._id,
      type: 'INTERVIEW_SCHEDULED',
      description: `Technical interview scheduled for David Wilson with Tech Lead`,
      metadata: {
        interviewId: technicalInterview._id,
        date: daysAgo(5),
        time: '11:00 AM',
        type: 'Technical',
        interviewerName: 'Tech Lead',
        round: 'Technical',
      },
      createdAt: daysAgo(6),
    });

    await TimelineEvent.create({
      candidateId: candidate4._id,
      type: 'INTERVIEW_COMPLETED',
      description: `✅ Technical interview PASSED for David Wilson. Ready for offer approval.`,
      metadata: {
        interviewId: technicalInterview._id,
        feedback: 'Strong technical skills, good cultural fit',
        recommendation: 'Ready to Offer',
        round: 'Technical',
      },
      createdAt: daysAgo(5),
    });

    // Mark as hired
    await TimelineEvent.create({
      candidateId: candidate4._id,
      type: 'HIRED',
      description: '🎉 Candidate hired successfully!',
      createdAt: daysAgo(3),
    });

    // Create Offer Document with sample URLs (these won't actually work but will show in UI)
    const offerDoc = await OfferDocument.create({
      candidateId: candidate4._id,
      roleTitle: 'Senior Full-Stack Developer',
      salary: {
        amount: 170000,
        currency: 'USD',
      },
      startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      reportingManager: 'CTO',
      location: 'Austin, TX',
      offerLetterUrl: '/sample-offer-letter.pdf',
      ndaUrl: '/sample-nda.pdf',
      createdAt: daysAgo(2),
      updatedAt: daysAgo(2),
    });

    await TimelineEvent.create({
      candidateId: candidate4._id,
      type: 'OFFER_SENT',
      description: `Offer letter and NDA generated for David Wilson`,
      metadata: {
        roleTitle: 'Senior Full-Stack Developer',
        salary: '$170,000',
        startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        reportingManager: 'CTO',
        location: 'Austin, TX',
        offerLetterUrl: '/sample-offer-letter.pdf',
        ndaUrl: '/sample-nda.pdf',
      },
      createdAt: daysAgo(2),
    });

    // Candidate 5: Rejected
    const candidate5 = await Candidate.create({
      name: 'Eva Martinez',
      email: 'eva.martinez@example.com',
      jobId: jobs[2]._id,
      status: 'Rejected',
      resumeUrl: 'https://example.com/resume-eva.pdf',
      phone: '+1 (555) 789-0123',
      location: 'Seattle, WA',
      currentRole: 'DevOps Engineer at CloudTech',
      noticePeriod: '1 Month',
      salaryExpectation: '$140,000',
      linkedinUrl: 'https://linkedin.com/in/evamartinez',
      magicLinkToken: uuidv4(),
      magicLinkExpiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      isMagicLinkUsed: true,
      interviewRound: 'Completed',
      interviewCount: 1,
      screeningPassed: false,
      createdAt: daysAgo(4),
      updatedAt: daysAgo(1),
    });

    await TimelineEvent.create({
      candidateId: candidate5._id,
      type: 'APPLIED',
      description: `Candidate applied for ${jobs[2].title}`,
      metadata: { jobTitle: jobs[2].title },
      createdAt: daysAgo(4),
    });

    await TimelineEvent.create({
      candidateId: candidate5._id,
      type: 'FORM_SUBMITTED',
      description: 'Candidate completed the application form',
      metadata: {
        phone: '+1 (555) 789-0123',
        location: 'Seattle, WA',
        currentRole: 'DevOps Engineer at CloudTech',
        noticePeriod: '1 Month',
        salaryExpectation: '$140,000',
        linkedinUrl: 'https://linkedin.com/in/evamartinez',
      },
      createdAt: daysAgo(3),
    });

    // Interview for candidate 5
    const interview5 = await Interview.create({
      candidateId: candidate5._id,
      date: daysAgo(2),
      time: '1:00 PM',
      type: 'Screening',
      interviewerName: 'HR Manager',
      notes: 'Screening interview',
      round: 'Screening',
      status: 'Completed',
      isCompleted: true,
      feedback: 'Not a good fit for the role, lacks cloud experience',
      recommendation: 'Fail',
      createdAt: daysAgo(2),
      updatedAt: daysAgo(2),
    });

    await TimelineEvent.create({
      candidateId: candidate5._id,
      type: 'INTERVIEW_SCHEDULED',
      description: `Screening interview scheduled for Eva Martinez with HR Manager`,
      metadata: {
        interviewId: interview5._id,
        date: daysAgo(2),
        time: '1:00 PM',
        type: 'Screening',
        interviewerName: 'HR Manager',
        round: 'Screening',
      },
      createdAt: daysAgo(2),
    });

    await TimelineEvent.create({
      candidateId: candidate5._id,
      type: 'INTERVIEW_COMPLETED',
      description: `❌ Candidate rejected after Screening interview`,
      metadata: {
        interviewId: interview5._id,
        feedback: 'Not a good fit for the role, lacks cloud experience',
        recommendation: 'Fail',
        round: 'Screening',
      },
      createdAt: daysAgo(2),
    });

    await TimelineEvent.create({
      candidateId: candidate5._id,
      type: 'REJECTED',
      description: '❌ Candidate rejected: Does not meet technical requirements',
      metadata: { reason: 'Does not meet technical requirements' },
      createdAt: daysAgo(1),
    });

    console.log(`👥 Created 5 candidates`);

    // ============================================
    // 3. CREATE HR USER (if not exists)
    // ============================================
    let hrUser = await User.findOne({ email: 'hr@rovedashcam.com' });
    if (!hrUser) {
      hrUser = await User.create({
        name: 'HR Manager',
        email: 'hr@rovedashcam.com',
        password: 'password123',
        role: 'HR',
      });
      console.log('👤 Created HR user: hr@rovedashcam.com / password123');
    } else {
      console.log('👤 HR user already exists');
    }

    // ============================================
    // 4. SUMMARY
    // ============================================
    console.log('\n✅ Seed completed successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📋 Jobs created: ${jobs.length}`);
    console.log(`👥 Candidates created: 5`);
    console.log(`📝 Timeline events created: ${await TimelineEvent.countDocuments()}`);
    console.log(`📅 Interviews created: ${await Interview.countDocuments()}`);
    console.log(`📄 Offer documents created: ${await OfferDocument.countDocuments()}`);
    console.log('\n🔐 Test HR Login:');
    console.log('   Email: hr@rovedashcam.com');
    console.log('   Password: password123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return NextResponse.json({
      message: 'Seed completed successfully!',
      data: {
        jobs: jobs.length,
        candidates: 5,
        interviews: await Interview.countDocuments(),
        offerDocuments: await OfferDocument.countDocuments(),
        hrUser: {
          email: 'hr@rovedashcam.com',
          password: 'password123',
        },
        candidatesList: [
          { name: candidate1.name, status: candidate1.status },
          { name: candidate2.name, status: candidate2.status },
          { name: candidate3.name, status: candidate3.status },
          { name: candidate4.name, status: candidate4.status },
          { name: candidate5.name, status: candidate5.status },
        ],
      },
    }, { status: 201 });
  } catch (error) {
    console.error('❌ Seed error:', error);
    return NextResponse.json(
      { error: 'Failed to seed data: ' + (error as Error).message },
      { status: 500 }
    );
  }
}