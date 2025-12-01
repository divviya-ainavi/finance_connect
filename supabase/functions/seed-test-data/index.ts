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
