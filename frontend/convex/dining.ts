import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all dining halls for an institution
export const getDiningHalls = query({
  args: {
    institution: v.optional(v.string()),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.institution) {
      return await ctx.db
        .query("campusDining")
        .withIndex("by_institution", (q) => q.eq("institution", args.institution))
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();
    } else if (args.userId) {
      return await ctx.db
        .query("campusDining")
        .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();
    } else {
      return await ctx.db
        .query("campusDining")
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();
    }
  },
});

// Get specific dining hall details
export const getDiningHall = query({
  args: {
    diningHallId: v.id("campusDining"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.diningHallId);
  },
});

// Create or update dining hall information
export const upsertDiningHall = mutation({
  args: {
    userId: v.optional(v.string()),
    diningHallName: v.string(),
    location: v.string(),
    description: v.optional(v.string()),
    operatingHours: v.array(
      v.object({
        dayOfWeek: v.string(),
        openTime: v.string(),
        closeTime: v.string(),
        mealPeriods: v.array(
          v.object({
            name: v.string(),
            startTime: v.string(),
            endTime: v.string(),
          })
        ),
      })
    ),
    currentMenu: v.optional(
      v.array(
        v.object({
          mealPeriod: v.string(),
          date: v.string(),
          items: v.array(
            v.object({
              name: v.string(),
              description: v.optional(v.string()),
              category: v.string(),
              price: v.optional(v.number()),
              calories: v.optional(v.number()),
              dietaryRestrictions: v.optional(v.array(v.string())),
              allergens: v.optional(v.array(v.string())),
              nutritionFacts: v.optional(
                v.object({
                  protein: v.optional(v.number()),
                  carbs: v.optional(v.number()),
                  fat: v.optional(v.number()),
                  fiber: v.optional(v.number()),
                  sodium: v.optional(v.number()),
                })
              ),
            })
          ),
        })
      )
    ),
    services: v.optional(v.array(v.string())),
    paymentMethods: v.optional(v.array(v.string())),
    contactInfo: v.optional(
      v.object({
        phone: v.optional(v.string()),
        email: v.optional(v.string()),
        website: v.optional(v.string()),
        manager: v.optional(v.string()),
      })
    ),
    favoriteItems: v.optional(v.array(v.string())),
    dietaryPreferences: v.optional(v.array(v.string())),
    institution: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("campusDining")
      .withIndex("by_dining_hall", (q) => q.eq("diningHallName", args.diningHallName))
      .filter((q) => {
        if (args.institution) {
          return q.eq(q.field("institution"), args.institution);
        }
        if (args.userId) {
          return q.eq(q.field("userId"), args.userId);
        }
        return true;
      })
      .first();

    const now = Date.now();
    const data = {
      ...args,
      isActive: args.isActive ?? true,
      updatedAt: now,
    };

    if (existing) {
      return await ctx.db.patch(existing._id, data);
    } else {
      return await ctx.db.insert("campusDining", {
        ...data,
        createdAt: now,
      });
    }
  },
});

// Update menu for a specific dining hall
export const updateDiningMenu = mutation({
  args: {
    diningHallId: v.id("campusDining"),
    menu: v.array(
      v.object({
        mealPeriod: v.string(),
        date: v.string(),
        items: v.array(
          v.object({
            name: v.string(),
            description: v.optional(v.string()),
            category: v.string(),
            price: v.optional(v.number()),
            calories: v.optional(v.number()),
            dietaryRestrictions: v.optional(v.array(v.string())),
            allergens: v.optional(v.array(v.string())),
            nutritionFacts: v.optional(
              v.object({
                protein: v.optional(v.number()),
                carbs: v.optional(v.number()),
                fat: v.optional(v.number()),
                fiber: v.optional(v.number()),
                sodium: v.optional(v.number()),
              })
            ),
          })
        ),
      })
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.diningHallId, {
      currentMenu: args.menu,
      updatedAt: Date.now(),
    });
  },
});

// Add user's favorite items
export const updateUserDiningPreferences = mutation({
  args: {
    userId: v.string(),
    diningHallId: v.id("campusDining"),
    favoriteItems: v.optional(v.array(v.string())),
    dietaryPreferences: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const diningHall = await ctx.db.get(args.diningHallId);
    if (!diningHall) {
      throw new Error("Dining hall not found");
    }

    // If this is a user-specific dining hall, update it
    if (diningHall.userId === args.userId) {
      return await ctx.db.patch(args.diningHallId, {
        favoriteItems: args.favoriteItems,
        dietaryPreferences: args.dietaryPreferences,
        updatedAt: Date.now(),
      });
    }

    // Otherwise, create a user-specific copy
    return await ctx.db.insert("campusDining", {
      userId: args.userId,
      diningHallName: diningHall.diningHallName,
      location: diningHall.location,
      description: diningHall.description,
      operatingHours: diningHall.operatingHours,
      currentMenu: diningHall.currentMenu,
      services: diningHall.services,
      paymentMethods: diningHall.paymentMethods,
      contactInfo: diningHall.contactInfo,
      favoriteItems: args.favoriteItems,
      dietaryPreferences: args.dietaryPreferences,
      institution: diningHall.institution,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Get today's menu for a specific dining hall
export const getTodaysMenu = query({
  args: {
    diningHallId: v.id("campusDining"),
    date: v.optional(v.string()), // YYYY-MM-DD format
  },
  handler: async (ctx, args) => {
    const diningHall = await ctx.db.get(args.diningHallId);
    if (!diningHall) {
      return null;
    }

    const targetDate = args.date || new Date().toISOString().split('T')[0];
    
    const todaysMenu = diningHall.currentMenu?.filter(menu => menu.date === targetDate) || [];
    
    return {
      diningHall: {
        id: diningHall._id,
        name: diningHall.diningHallName,
        location: diningHall.location,
        operatingHours: diningHall.operatingHours,
      },
      menu: todaysMenu,
      date: targetDate,
    };
  },
});

// Search menu items across all dining halls
export const searchMenuItems = query({
  args: {
    searchTerm: v.string(),
    dietaryRestrictions: v.optional(v.array(v.string())),
    institution: v.optional(v.string()),
    date: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let diningHalls;

    if (args.institution) {
      diningHalls = await ctx.db
        .query("campusDining")
        .withIndex("by_institution", (q) => q.eq("institution", args.institution))
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();
    } else {
      diningHalls = await ctx.db
        .query("campusDining")
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();
    }

    const targetDate = args.date || new Date().toISOString().split('T')[0];
    const searchLower = args.searchTerm.toLowerCase();
    const results: any[] = [];

    for (const hall of diningHalls) {
      if (!hall.currentMenu) continue;

      for (const menuPeriod of hall.currentMenu) {
        if (menuPeriod.date !== targetDate) continue;

        for (const item of menuPeriod.items) {
          const matchesSearch = 
            item.name.toLowerCase().includes(searchLower) ||
            (item.description && item.description.toLowerCase().includes(searchLower));

          const matchesDietary = !args.dietaryRestrictions || 
            args.dietaryRestrictions.every(restriction => 
              item.dietaryRestrictions?.includes(restriction)
            );

          if (matchesSearch && matchesDietary) {
            results.push({
              ...item,
              diningHall: hall.diningHallName,
              diningHallId: hall._id,
              location: hall.location,
              mealPeriod: menuPeriod.mealPeriod,
              date: menuPeriod.date,
            });
          }
        }
      }
    }

    return results;
  },
});