import OpenAI from "openai";
import dotenv from "dotenv";
import readlineSync from "readline-sync";

dotenv.config();    

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const systemPrompt = "You are an AI fitness and nutrition coach. You provide users with personalized workout plans and dietary advice based on their fitness level, goals, and dietary restrictions. Always encourage a balanced approach and healthy habits. If a user asks about specific conditions, advise them to consult a medical professional before making changes. Strictly follow JSON format.";

const messages = [{role:"system", content: systemPrompt}];

const tools = [
  {
    type: "function",
    function: {
      name: "get_workout_plan",
      description: "Get a personalized workout plan for the user",
      parameters: {
        type: "object",
        properties: {
          fitness_level: {
            type: "string",
            enum: ["beginner", "intermediate", "advanced"],
            description: "User's current fitness level"
          },
          goals: {
            type: "string",
            description: "User's fitness goals"
          },
          time_available: {
            type: "string",
            description: "Time available for workouts per week"
          }
        },
        required: ["fitness_level", "goals", "time_available"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_diet_plan",
      description: "Get a personalized diet plan for the user",
      parameters: {
        type: "object",
        properties: {
          dietary_restrictions: {
            type: "array",
            items: { type: "string" },
            description: "User's dietary restrictions"
          },
          goals: {
            type: "string",
            description: "User's nutrition goals"
          },
          meals_per_day: {
            type: "number",
            description: "Number of meals per day"
          }
        },
        required: ["dietary_restrictions", "goals", "meals_per_day"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_nutrition_plan",
      description: "Get a detailed nutrition plan for the user",
      parameters: {
        type: "object",
        properties: {
          daily_calories: {
            type: "number",
            description: "Target daily calories"
          },
          macros: {
            type: "object",
            properties: {
              protein: { type: "number" },
              carbs: { type: "number" },
              fats: { type: "number" }
            }
          },
          meal_timing: {
            type: "array",
            items: { type: "string" },
            description: "Recommended meal timing"
          }
        },
        required: ["daily_calories", "macros", "meal_timing"]
      }
    }
  }
];

// Function implementations
const functionImplementations = {
  get_workout_plan: async (fitness_level, goals, time_available) => {
    // In a real implementation, this would generate a detailed workout plan
    return {
      output: {
        content: {
          text: {
            message: `Generated a ${fitness_level} level workout plan for ${goals} goals with ${time_available} available per week.`
          }
        }
      }
    };
  },
  get_diet_plan: async (dietary_restrictions, goals, meals_per_day) => {
    // In a real implementation, this would generate a detailed diet plan
    return {
      output: {
        content: {
          text: {
            message: `Generated a diet plan considering ${dietary_restrictions.join(", ")} restrictions for ${goals} goals with ${meals_per_day} meals per day.`
          }
        }
      }
    };
  },
  get_nutrition_plan: async (daily_calories, macros, meal_timing) => {
    // In a real implementation, this would generate a detailed nutrition plan
    return {
      output: {
        content: {
          text: {
            message: `Generated a nutrition plan with ${daily_calories} calories daily, macros: ${JSON.stringify(macros)}, and meal timing: ${meal_timing.join(", ")}.`
          }
        }
      }
    };
  }
};

async function main() {
  try {
    while (true) {
      const query = readlineSync.question(">> ");
      if (query.toLowerCase() === 'exit') break;

      messages.push({role: "user", content: query});

      while (true) {
        try {
          const chat = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: messages,
            tools: tools,
            tool_choice: "auto",
            temperature: 0.7
          });

          const response = chat.choices[0].message;
          messages.push(response);

          if (response.tool_calls) {
            for (const toolCall of response.tool_calls) {
              const functionName = toolCall.function.name;
              const functionArgs = JSON.parse(toolCall.function.arguments);
              
              if (functionImplementations[functionName]) {
                const result = await functionImplementations[functionName](...Object.values(functionArgs));
                messages.push({
                  role: "tool",
                  content: JSON.stringify(result),
                  tool_call_id: toolCall.id
                });
                console.log(result.output.content.text.message);
              }
            }
          } else {
            console.log(response.content);
            break;
          }
        } catch (error) {
          console.error("Error in chat completion:", error);
          break;
        }
      }
    }
  } catch (error) {
    console.error("Fatal error:", error);
  }
}

main().catch(console.error);

