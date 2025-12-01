import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TestUser {
  email: string;
  password: string;
  name: string;
  type: "worker" | "business";
  data?: any;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Test workers
    const workers: TestUser[] = [
      {
        email: "sarah@test.com",
        password: "testpass123",
        name: "Sarah Thompson",
        type: "worker",
        data: {
          location: "Manchester",
          roles: ["payroll_clerk", "accounts_payable"],
          hourly_rate_min: 20,
          hourly_rate_max: 28,
          rate_negotiable: true,
          onsite_preference: "hybrid",
          max_days_onsite: 2,
          total_hours_per_week: 25,
          industries: ["Professional Services", "Technology"],
          company_sizes: ["sme", "mid_large"],
          own_equipment: true,
          availability: {
            Monday: ["AM", "PM"],
            Tuesday: ["AM", "PM"],
            Wednesday: ["AM"],
            Thursday: ["AM", "PM"],
            Friday: ["AM"],
          },
          skills: [
            { name: "PAYE, NI, statutory payments", level: 4 },
            { name: "Pensions, auto-enrolment", level: 3 },
            { name: "AP/AR cycles", level: 3 },
          ],
          systems: [
            { name: "Xero", level: 4 },
            { name: "Sage", level: 3 },
            { name: "QuickBooks", level: 2 },
          ],
          languages: [{ name: "English", written: "native", spoken: "native" }],
          qualifications: [{ type: "aat_level_3", details: "AAT Level 3 Certificate", year: 2018 }],
        },
      },
      {
        email: "james@test.com",
        password: "testpass123",
        name: "James Wilson",
        type: "worker",
        data: {
          location: "Birmingham",
          roles: ["bookkeeper", "accounts_receivable"],
          hourly_rate_min: 18,
          hourly_rate_max: 25,
          rate_negotiable: false,
          onsite_preference: "fully_remote",
          total_hours_per_week: 30,
          industries: ["Retail", "Manufacturing"],
          company_sizes: ["micro", "sme"],
          own_equipment: true,
          available_from: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          availability: {
            Monday: ["AM", "PM", "Evening"],
            Tuesday: ["AM", "PM"],
            Wednesday: ["AM", "PM", "Evening"],
            Thursday: ["AM", "PM"],
            Friday: ["AM", "PM"],
          },
          skills: [
            { name: "Bank reconciliations", level: 4 },
            { name: "Ledger maintenance", level: 4 },
            { name: "AP/AR cycles", level: 3 },
            { name: "Debt chasing", level: 3 },
          ],
          systems: [
            { name: "QuickBooks", level: 4 },
            { name: "Excel", level: 4 },
            { name: "Sage", level: 2 },
          ],
          languages: [{ name: "English", written: "native", spoken: "native" }],
          qualifications: [{ type: "aat_level_4", details: "AAT Professional Diploma", year: 2020 }],
        },
      },
      {
        email: "priya@test.com",
        password: "testpass123",
        name: "Priya Patel",
        type: "worker",
        data: {
          location: "Leeds",
          roles: ["management_accountant", "finance_manager"],
          hourly_rate_min: 30,
          hourly_rate_max: 40,
          rate_negotiable: true,
          onsite_preference: "hybrid",
          max_days_onsite: 3,
          total_hours_per_week: 20,
          industries: ["Healthcare", "Finance", "Technology"],
          company_sizes: ["mid_large", "multi_entity"],
          own_equipment: true,
          availability: {
            Monday: ["AM", "PM"],
            Tuesday: ["AM", "PM"],
            Thursday: ["AM", "PM"],
            Friday: ["AM"],
          },
          skills: [
            { name: "Month-end close", level: 4 },
            { name: "Accruals & prepayments", level: 4 },
            { name: "Budgeting & forecasting", level: 4 },
            { name: "Board pack reporting", level: 3 },
          ],
          systems: [
            { name: "Sage", level: 4 },
            { name: "SAP", level: 3 },
            { name: "Excel", level: 4 },
            { name: "Power BI", level: 3 },
          ],
          languages: [
            { name: "English", written: "native", spoken: "native" },
            { name: "Hindi", written: "intermediate", spoken: "fluent" },
          ],
          qualifications: [
            { type: "cima_qualified", details: "CIMA Qualified", year: 2019 },
            { type: "degree", details: "BSc Accounting & Finance", year: 2015 },
          ],
        },
      },
      {
        email: "michael@test.com",
        password: "testpass123",
        name: "Michael O'Brien",
        type: "worker",
        data: {
          location: "Bristol",
          roles: ["credit_controller"],
          hourly_rate_min: 18,
          hourly_rate_max: 22,
          rate_negotiable: false,
          onsite_preference: "onsite",
          max_days_onsite: 5,
          total_hours_per_week: 35,
          industries: ["Construction", "Manufacturing"],
          company_sizes: ["sme", "mid_large"],
          own_equipment: false,
          available_from: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          availability: {
            Monday: ["AM", "PM"],
            Tuesday: ["AM", "PM"],
            Wednesday: ["AM", "PM"],
            Thursday: ["AM", "PM"],
            Friday: ["AM", "PM"],
          },
          skills: [
            { name: "Debt chasing", level: 4 },
            { name: "Credit checks", level: 3 },
            { name: "AP/AR cycles", level: 3 },
          ],
          systems: [
            { name: "Sage", level: 3 },
            { name: "Excel", level: 3 },
          ],
          languages: [{ name: "English", written: "native", spoken: "native" }],
          qualifications: [{ type: "aat_level_2", details: "AAT Level 2 Certificate", year: 2017 }],
        },
      },
      {
        email: "emma.richardson@test.com",
        password: "testpass123",
        name: "Emma Richardson",
        type: "worker",
        data: {
          location: "London",
          roles: ["financial_controller", "cfo_fpa"],
          hourly_rate_min: 45,
          hourly_rate_max: 60,
          rate_negotiable: true,
          onsite_preference: "hybrid",
          max_days_onsite: 2,
          total_hours_per_week: 20,
          industries: ["Technology", "Finance", "Professional Services"],
          company_sizes: ["mid_large", "multi_entity"],
          own_equipment: true,
          availability: {
            Tuesday: ["AM", "PM"],
            Wednesday: ["AM", "PM"],
            Thursday: ["AM"],
          },
          skills: [
            { name: "Month-end close", level: 4 },
            { name: "Budgeting & forecasting", level: 4 },
            { name: "Board pack reporting", level: 4 },
            { name: "FP&A modeling", level: 4 },
          ],
          systems: [
            { name: "SAP", level: 4 },
            { name: "Oracle", level: 3 },
            { name: "Excel", level: 4 },
            { name: "Power BI", level: 4 },
          ],
          languages: [{ name: "English", written: "native", spoken: "native" }],
          qualifications: [
            { type: "acca_qualified", details: "ACCA Qualified", year: 2017 },
            { type: "degree", details: "BSc Finance", year: 2013 },
          ],
        },
      },
      {
        email: "david.chen@test.com",
        password: "testpass123",
        name: "David Chen",
        type: "worker",
        data: {
          location: "Edinburgh",
          roles: ["bookkeeper", "accounts_payable"],
          hourly_rate_min: 16,
          hourly_rate_max: 22,
          rate_negotiable: true,
          onsite_preference: "fully_remote",
          total_hours_per_week: 35,
          industries: ["Retail", "Hospitality"],
          company_sizes: ["micro", "sme"],
          own_equipment: true,
          availability: {
            Monday: ["AM", "PM"],
            Tuesday: ["AM", "PM"],
            Wednesday: ["AM", "PM"],
            Thursday: ["AM", "PM"],
            Friday: ["AM"],
          },
          skills: [
            { name: "Bank reconciliations", level: 3 },
            { name: "Invoice processing", level: 4 },
            { name: "AP/AR cycles", level: 3 },
          ],
          systems: [
            { name: "QuickBooks", level: 4 },
            { name: "Xero", level: 3 },
            { name: "Excel", level: 3 },
          ],
          languages: [
            { name: "English", written: "fluent", spoken: "fluent" },
            { name: "Mandarin", written: "native", spoken: "native" },
          ],
          qualifications: [{ type: "aat_level_3", details: "AAT Level 3", year: 2019 }],
        },
      },
      {
        email: "lisa.murphy@test.com",
        password: "testpass123",
        name: "Lisa Murphy",
        type: "worker",
        data: {
          location: "Cardiff",
          roles: ["payroll_clerk"],
          hourly_rate_min: 17,
          hourly_rate_max: 23,
          rate_negotiable: false,
          onsite_preference: "hybrid",
          max_days_onsite: 3,
          total_hours_per_week: 28,
          industries: ["Healthcare", "Education"],
          company_sizes: ["sme", "mid_large"],
          own_equipment: true,
          availability: {
            Monday: ["AM", "PM"],
            Tuesday: ["AM", "PM"],
            Wednesday: ["AM", "PM"],
            Thursday: ["AM", "PM"],
            Friday: ["AM"],
          },
          skills: [
            { name: "PAYE, NI, statutory payments", level: 4 },
            { name: "Pensions, auto-enrolment", level: 4 },
            { name: "Payroll software admin", level: 3 },
          ],
          systems: [
            { name: "Sage Payroll", level: 4 },
            { name: "BrightPay", level: 3 },
            { name: "Excel", level: 3 },
          ],
          languages: [{ name: "English", written: "native", spoken: "native" }],
          qualifications: [{ type: "aat_level_2", details: "AAT Level 2", year: 2018 }],
        },
      },
      {
        email: "raj.sharma@test.com",
        password: "testpass123",
        name: "Raj Sharma",
        type: "worker",
        data: {
          location: "Glasgow",
          roles: ["management_accountant"],
          hourly_rate_min: 28,
          hourly_rate_max: 38,
          rate_negotiable: true,
          onsite_preference: "fully_remote",
          total_hours_per_week: 25,
          industries: ["Manufacturing", "Technology"],
          company_sizes: ["mid_large"],
          own_equipment: true,
          available_from: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          availability: {
            Monday: ["AM", "PM"],
            Tuesday: ["AM", "PM"],
            Wednesday: ["AM", "PM"],
            Thursday: ["AM"],
          },
          skills: [
            { name: "Month-end close", level: 4 },
            { name: "Variance analysis", level: 4 },
            { name: "Budgeting & forecasting", level: 3 },
          ],
          systems: [
            { name: "Sage", level: 4 },
            { name: "Excel", level: 4 },
            { name: "Power BI", level: 2 },
          ],
          languages: [
            { name: "English", written: "fluent", spoken: "fluent" },
            { name: "Punjabi", written: "basic", spoken: "fluent" },
          ],
          qualifications: [{ type: "cima_part_qualified", details: "CIMA Part Qualified", year: 2020 }],
        },
      },
      {
        email: "claire.williams@test.com",
        password: "testpass123",
        name: "Claire Williams",
        type: "worker",
        data: {
          location: "Newcastle",
          roles: ["credit_controller", "accounts_receivable"],
          hourly_rate_min: 19,
          hourly_rate_max: 26,
          rate_negotiable: true,
          onsite_preference: "onsite",
          max_days_onsite: 5,
          total_hours_per_week: 32,
          industries: ["Construction", "Retail"],
          company_sizes: ["sme"],
          own_equipment: false,
          availability: {
            Monday: ["AM", "PM"],
            Tuesday: ["AM", "PM"],
            Wednesday: ["AM", "PM"],
            Thursday: ["AM", "PM"],
            Friday: ["AM", "PM"],
          },
          skills: [
            { name: "Debt chasing", level: 4 },
            { name: "Credit checks", level: 4 },
            { name: "AP/AR cycles", level: 3 },
          ],
          systems: [
            { name: "Sage", level: 4 },
            { name: "Excel", level: 3 },
          ],
          languages: [{ name: "English", written: "native", spoken: "native" }],
          qualifications: [{ type: "aat_level_3", details: "AAT Level 3", year: 2016 }],
        },
      },
      {
        email: "tom.anderson@test.com",
        password: "testpass123",
        name: "Tom Anderson",
        type: "worker",
        data: {
          location: "Liverpool",
          roles: ["bookkeeper"],
          hourly_rate_min: 15,
          hourly_rate_max: 20,
          rate_negotiable: false,
          onsite_preference: "fully_remote",
          total_hours_per_week: 40,
          industries: ["Retail", "Professional Services"],
          company_sizes: ["micro", "sme"],
          own_equipment: true,
          availability: {
            Monday: ["AM", "PM", "Evening"],
            Tuesday: ["AM", "PM"],
            Wednesday: ["AM", "PM", "Evening"],
            Thursday: ["AM", "PM"],
            Friday: ["AM", "PM"],
          },
          skills: [
            { name: "Bank reconciliations", level: 4 },
            { name: "Ledger maintenance", level: 4 },
            { name: "VAT returns", level: 3 },
          ],
          systems: [
            { name: "Xero", level: 4 },
            { name: "QuickBooks", level: 3 },
            { name: "Excel", level: 3 },
          ],
          languages: [{ name: "English", written: "native", spoken: "native" }],
          qualifications: [{ type: "aat_level_4", details: "AAT Professional Diploma", year: 2021 }],
        },
      },
    ];

    // Test businesses
    const businesses: TestUser[] = [
      {
        email: "tech@test.com",
        password: "testpass123",
        name: "Tom Chen",
        type: "business",
        data: {
          company_name: "TechStart Solutions",
          contact_name: "Tom Chen",
          contact_role: "Finance Director",
        },
      },
      {
        email: "health@test.com",
        password: "testpass123",
        name: "Emma Davies",
        type: "business",
        data: {
          company_name: "Healthcare Partners",
          contact_name: "Emma Davies",
          contact_role: "Operations Manager",
        },
      },
      {
        email: "legal@test.com",
        password: "testpass123",
        name: "Robert Smith",
        type: "business",
        data: {
          company_name: "Smith & Associates",
          contact_name: "Robert Smith",
          contact_role: "Managing Partner",
        },
      },
      {
        email: "retail@test.com",
        password: "testpass123",
        name: "Jenny Brown",
        type: "business",
        data: {
          company_name: "RetailMax UK",
          contact_name: "Jenny Brown",
          contact_role: "Financial Director",
        },
      },
      {
        email: "startup@test.com",
        password: "testpass123",
        name: "Alex Kumar",
        type: "business",
        data: {
          company_name: "InnovateTech",
          contact_name: "Alex Kumar",
          contact_role: "CEO",
        },
      },
      {
        email: "property@test.com",
        password: "testpass123",
        name: "Mark Johnson",
        type: "business",
        data: {
          company_name: "PropertyFirst",
          contact_name: "Mark Johnson",
          contact_role: "Operations Director",
        },
      },
      {
        email: "agency@test.com",
        password: "testpass123",
        name: "Sophie Martin",
        type: "business",
        data: {
          company_name: "Creative Agency Co",
          contact_name: "Sophie Martin",
          contact_role: "Finance Manager",
        },
      },
      {
        email: "logistics@test.com",
        password: "testpass123",
        name: "Peter Wilson",
        type: "business",
        data: {
          company_name: "FastTrack Logistics",
          contact_name: "Peter Wilson",
          contact_role: "CFO",
        },
      },
    ];

    const allUsers = [...workers, ...businesses];
    const createdWorkerIds: string[] = [];
    const createdBusinessIds: string[] = [];

    console.log("Starting to create test accounts...");

    // Create users
    for (const user of allUsers) {
      console.log(`Creating user: ${user.email}`);
      
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
      });

      if (authError) {
        console.error(`Error creating auth user ${user.email}:`, authError);
        continue;
      }

      const userId = authData.user.id;
      console.log(`Created auth user ${user.email} with ID: ${userId}`);

      // Create profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .insert({ user_id: userId, user_type: user.type })
        .select()
        .single();

      if (profileError) {
        console.error(`Error creating profile for ${user.email}:`, profileError);
        continue;
      }

      const profileId = profileData.id;
      console.log(`Created profile for ${user.email}`);

      // Create worker or business profile
      if (user.type === "worker" && user.data) {
        const { data: workerData, error: workerError } = await supabase
          .from("worker_profiles")
          .insert({
            profile_id: profileId,
            name: user.name,
            visibility_mode: "fully_disclosed",
            roles: user.data.roles,
            location: user.data.location,
            hourly_rate_min: user.data.hourly_rate_min,
            hourly_rate_max: user.data.hourly_rate_max,
            rate_negotiable: user.data.rate_negotiable,
            onsite_preference: user.data.onsite_preference,
            max_days_onsite: user.data.max_days_onsite,
            total_hours_per_week: user.data.total_hours_per_week,
            available_from: user.data.available_from || null,
            availability: user.data.availability,
            industries: user.data.industries,
            company_sizes: user.data.company_sizes,
            own_equipment: user.data.own_equipment,
          })
          .select()
          .single();

        if (workerError) {
          console.error(`Error creating worker profile for ${user.email}:`, workerError);
          continue;
        }

        const workerProfileId = workerData.id;
        createdWorkerIds.push(workerProfileId);
        console.log(`Created worker profile for ${user.email}`);

        // Insert skills
        if (user.data.skills) {
          const skillsToInsert = user.data.skills.map((skill: any) => ({
            worker_profile_id: workerProfileId,
            skill_name: skill.name,
            skill_level: skill.level,
          }));

          await supabase.from("worker_skills").insert(skillsToInsert);
          console.log(`Inserted ${skillsToInsert.length} skills for ${user.email}`);
        }

        // Insert systems
        if (user.data.systems) {
          const systemsToInsert = user.data.systems.map((system: any) => ({
            worker_profile_id: workerProfileId,
            system_name: system.name,
            proficiency_level: system.level,
          }));

          await supabase.from("worker_system_proficiency").insert(systemsToInsert);
          console.log(`Inserted ${systemsToInsert.length} systems for ${user.email}`);
        }

        // Insert languages
        if (user.data.languages) {
          const languagesToInsert = user.data.languages.map((lang: any) => ({
            worker_profile_id: workerProfileId,
            language_name: lang.name,
            written_level: lang.written,
            spoken_level: lang.spoken,
          }));

          await supabase.from("worker_languages").insert(languagesToInsert);
          console.log(`Inserted ${languagesToInsert.length} languages for ${user.email}`);
        }

        // Insert qualifications
        if (user.data.qualifications) {
          const qualsToInsert = user.data.qualifications.map((qual: any) => ({
            worker_profile_id: workerProfileId,
            qualification_type: qual.type,
            details: qual.details,
            year_obtained: qual.year,
          }));

          await supabase.from("worker_qualifications").insert(qualsToInsert);
          console.log(`Inserted ${qualsToInsert.length} qualifications for ${user.email}`);
        }
      } else if (user.type === "business" && user.data) {
        const { data: businessData, error: businessError } = await supabase
          .from("business_profiles")
          .insert({
            profile_id: profileId,
            company_name: user.data.company_name,
            contact_name: user.data.contact_name,
            contact_role: user.data.contact_role,
          })
          .select()
          .single();

        if (businessError) {
          console.error(`Error creating business profile for ${user.email}:`, businessError);
          continue;
        }

        createdBusinessIds.push(businessData.id);
        console.log(`Created business profile for ${user.email}`);
      }
    }

    console.log("All test accounts created successfully!");
    console.log(`Workers created: ${createdWorkerIds.length}`);
    console.log(`Businesses created: ${createdBusinessIds.length}`);

    // Create connection requests and reviews
    console.log("Creating connection requests and reviews...");
    const connectionRequestsData: any[] = [];
    const reviewsData: any[] = [];

    // Get ALL profile IDs for workers and businesses (not just newly created)
    const { data: workerProfiles } = await supabase
      .from("worker_profiles")
      .select("id, profile_id, name");

    const { data: businessProfiles } = await supabase
      .from("business_profiles")
      .select("id, profile_id, company_name");

    // Create mappings for reviews
    const workerIdToProfileId = new Map(
      workerProfiles?.map(w => [w.id, w.profile_id]) || []
    );
    const businessIdToProfileId = new Map(
      businessProfiles?.map(b => [b.id, b.profile_id]) || []
    );
    const workerIdToName = new Map(
      workerProfiles?.map(w => [w.id, w.name]) || []
    );

    if (workerProfiles && businessProfiles && workerProfiles.length > 0 && businessProfiles.length > 0) {
      // Create 15-20 connection requests with varied statuses
      const statuses = ["accepted", "accepted", "accepted", "accepted", "accepted", "pending", "pending", "declined"];
      
      for (let i = 0; i < Math.min(18, workerProfiles.length * 2); i++) {
        const workerIndex = i % workerProfiles.length;
        const businessIndex = i % businessProfiles.length;
        const status = statuses[i % statuses.length];
        
        const connectionRequest = {
          worker_profile_id: workerProfiles[workerIndex].id,
          business_profile_id: businessProfiles[businessIndex].id,
          status,
          message: `We're interested in your ${status === "accepted" ? "expertise" : "skills"} for our team.`,
          hours_per_week: 15 + (i * 3) % 20,
          rate_offered: 18 + (i * 2) % 30,
          remote_onsite: i % 3 === 0 ? "fully_remote" : i % 3 === 1 ? "hybrid" : "onsite",
        };
        
        connectionRequestsData.push(connectionRequest);
      }

      // Insert connection requests
      const { data: insertedRequests, error: requestError } = await supabase
        .from("connection_requests")
        .insert(connectionRequestsData)
        .select();

      if (requestError) {
        console.error("Error creating connection requests:", requestError);
      } else {
        console.log(`Created ${insertedRequests?.length || 0} connection requests`);

        // Create reviews - ensure EVERY worker gets at least 2-3 reviews
        const acceptedRequests = insertedRequests?.filter((req: any) => req.status === "accepted") || [];
        
        const reviewTitles = [
          "Exceptional finance professional",
          "Great bookkeeper, highly recommend",
          "Outstanding payroll expertise",
          "Reliable and professional",
          "Excellent attention to detail",
          "Very knowledgeable accountant",
          "Superb credit control skills",
          "Fantastic management accountant",
          "Professional and punctual",
          "Highly skilled finance expert",
          "Brilliant analytical skills",
          "Thorough and accurate work",
          "Top-tier financial expertise",
          "Exceeded all expectations",
          "Invaluable team member",
        ];

        const reviewContents = [
          "delivered all reconciliations ahead of schedule. Attention to detail was outstanding.",
          "kept our accounts in perfect order. Very responsive and professional throughout.",
          "handled our payroll seamlessly. Their expertise with PAYE was invaluable.",
          "provided excellent service and clear communication at every stage.",
          "went above and beyond expectations. Would definitely work with again.",
          "brought real value to our finance operations. Highly professional approach.",
          "improved our credit control processes significantly. Great results.",
          "provided valuable insights into our financial position. Excellent work.",
          "completed all tasks efficiently and accurately. A pleasure to work with.",
          "demonstrated exceptional technical skills and professionalism throughout.",
          "transformed our reporting processes. Exceptional analytical capabilities.",
          "handled complex transactions with ease. Highly recommend their services.",
          "made our month-end close seamless. Outstanding technical knowledge.",
          "improved our cashflow forecasting dramatically. Great strategic insights.",
          "streamlined our AP processes brilliantly. Saved us hours each week.",
        ];

        // Track reviews per worker to ensure everyone gets at least 2
        const reviewsPerWorker = new Map<string, number>();
        
        // First pass: create reviews from accepted connections
        for (let i = 0; i < acceptedRequests.length; i++) {
          const request = acceptedRequests[i];
          const workerProfileId = request.worker_profile_id;
          
          // Track reviews for this worker
          if (!reviewsPerWorker.has(workerProfileId)) {
            reviewsPerWorker.set(workerProfileId, 0);
          }
          
          // Create business review (business reviewing worker)
          const workerName = workerIdToName.get(workerProfileId) || "The worker";
          const businessReviewerProfileId = businessIdToProfileId.get(request.business_profile_id);
          const workerRevieweeProfileId = workerIdToProfileId.get(workerProfileId);
          
          if (businessReviewerProfileId && workerRevieweeProfileId) {
            // Vary ratings between 3.5 and 5.0 (use integer 4 or 5)
            const rating = i % 5 === 0 ? 4 : 5;
            
            reviewsData.push({
              connection_request_id: request.id,
              reviewer_profile_id: businessReviewerProfileId,
              reviewee_profile_id: workerRevieweeProfileId,
              reviewer_type: "business",
              rating: rating,
              title: reviewTitles[i % reviewTitles.length],
              content: `${workerName} ${reviewContents[i % reviewContents.length]}`,
              rating_categories: {
                communication: Math.max(3, Math.min(5, rating + (i % 3 - 1))),
                quality_of_work: Math.max(3, Math.min(5, rating + ((i + 1) % 2))),
                professionalism: Math.max(4, Math.min(5, rating)),
                punctuality: Math.max(3, Math.min(5, rating - (i % 2))),
              },
            });
            
            reviewsPerWorker.set(workerProfileId, (reviewsPerWorker.get(workerProfileId) || 0) + 1);
          }
          
          // Create worker review (worker reviewing business) - less frequently
          if (i % 3 === 0) {
            const workerReviewerProfileId = workerIdToProfileId.get(workerProfileId);
            const businessRevieweeProfileId = businessIdToProfileId.get(request.business_profile_id);
            
            if (workerReviewerProfileId && businessRevieweeProfileId) {
              const rating = 4 + ((i + 1) % 2);
              
              reviewsData.push({
                connection_request_id: request.id,
                reviewer_profile_id: workerReviewerProfileId,
                reviewee_profile_id: businessRevieweeProfileId,
                reviewer_type: "worker",
                rating: rating,
                title: i % 2 === 0 ? "Great client to work with" : "Professional and supportive team",
                content: i % 2 === 0 
                  ? "Professional environment and clear communication. Payment was always on time."
                  : "Excellent collaboration and timely feedback. Very organized team to work with.",
                rating_categories: {
                  communication: Math.max(3, Math.min(5, rating)),
                  clarity_of_requirements: Math.max(3, Math.min(5, rating + (i % 2))),
                  timeliness_of_payment: Math.max(4, Math.min(5, rating)),
                  work_environment: Math.max(3, Math.min(5, rating - (i % 2))),
                },
              });
            }
          }
        }
        
        // Second pass: ensure ALL workers have at least 2 reviews
        for (const worker of workerProfiles) {
          const currentReviewCount = reviewsPerWorker.get(worker.id) || 0;
          const reviewsNeeded = Math.max(0, 2 - currentReviewCount);
          
          for (let j = 0; j < reviewsNeeded; j++) {
            // Find a business to review from (use round-robin)
            const businessIndex = (workerProfiles.indexOf(worker) + j) % businessProfiles.length;
            const business = businessProfiles[businessIndex];
            
            const businessReviewerProfileId = businessIdToProfileId.get(business.id);
            const workerRevieweeProfileId = workerIdToProfileId.get(worker.id);
            
            if (businessReviewerProfileId && workerRevieweeProfileId) {
              // Create a connection request for this review (even if not in original set)
              const tempConnectionRequest = {
                worker_profile_id: worker.id,
                business_profile_id: business.id,
                status: "accepted" as const,
                message: "Supplemental connection for review",
                hours_per_week: 10,
                rate_offered: 20,
                remote_onsite: "fully_remote",
              };
              
              const { data: tempRequest } = await supabase
                .from("connection_requests")
                .insert(tempConnectionRequest)
                .select()
                .single();
              
              if (tempRequest) {
                const workerName = workerIdToName.get(worker.id) || "The worker";
                const titleIndex = (workerProfiles.indexOf(worker) * 3 + j) % reviewTitles.length;
                const contentIndex = (workerProfiles.indexOf(worker) * 3 + j) % reviewContents.length;
                const rating = j % 4 === 0 ? 4 : 5;
                
                reviewsData.push({
                  connection_request_id: tempRequest.id,
                  reviewer_profile_id: businessReviewerProfileId,
                  reviewee_profile_id: workerRevieweeProfileId,
                  reviewer_type: "business",
                  rating: rating,
                  title: reviewTitles[titleIndex],
                  content: `${workerName} ${reviewContents[contentIndex]}`,
                  rating_categories: {
                    communication: Math.max(3, Math.min(5, rating + (j % 2))),
                    quality_of_work: Math.max(4, Math.min(5, rating)),
                    professionalism: Math.max(4, Math.min(5, rating)),
                    punctuality: Math.max(3, Math.min(5, rating - (j % 2))),
                  },
                });
              }
            }
          }
        }

        // Insert reviews
        const { error: reviewError } = await supabase
          .from("reviews")
          .insert(reviewsData);

        if (reviewError) {
          console.error("Error creating reviews:", reviewError);
        } else {
          console.log(`Created ${reviewsData.length} reviews`);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Test data seeded successfully",
        workers: createdWorkerIds.length,
        businesses: createdBusinessIds.length,
        credentials: {
          workers: workers.map((w) => ({ email: w.email, password: "testpass123" })),
          businesses: businesses.map((b) => ({ email: b.email, password: "testpass123" })),
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in seed-test-data function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
