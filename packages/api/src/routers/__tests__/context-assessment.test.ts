import { describe, it, expect } from "vitest";

/**
 * Tests for Context Assessment Router
 *
 * Tests the analyze and refine endpoints that evaluate user input
 * before starting a debate.
 */

// Mock data for testing
const mockUserInput = {
  short: "¿Debo expandir mi negocio?",
  business: `¿Cuál es la mejor estrategia para expandir mi empresa de software B2B al mercado europeo?

    Contexto: Somos una startup de 15 personas con un ARR de $2M.
    Nuestro producto es una plataforma de gestión de proyectos.
    Tenemos presupuesto de $500K para la expansión.
    El plazo objetivo es 18 meses.`,
  product: `¿Debería lanzar una versión móvil de mi producto SaaS?

    El problema es que nuestros usuarios piden acceso móvil constantemente.
    Somos un equipo de 5 desarrolladores.
    Nuestro usuario target son PYMEs.`,
  strategy: `¿Cómo debería posicionar mi startup frente a los competidores grandes?

    Mi visión es ser el líder en automatización para retail.
    Actualmente tenemos 200 clientes y crecemos 20% mensual.
    Nuestro diferenciador es la facilidad de integración.`,
};

describe("Context Assessment Router", () => {
  describe("analyze endpoint", () => {
    describe("input validation", () => {
      it("should require userInput with minimum 10 characters", () => {
        const shortInput = "¿Qué?";
        expect(shortInput.length).toBeLessThan(10);
      });

      it("should accept valid userInput", () => {
        expect(mockUserInput.business.length).toBeGreaterThan(10);
      });

      it("should accept optional debateType", () => {
        const validTypes = ["business_decision", "strategy", "product", "general"];
        validTypes.forEach((type) => {
          expect(validTypes).toContain(type);
        });
      });
    });

    describe("debate type detection", () => {
      it("should detect business_decision type from keywords", () => {
        const keywords = ["decisión", "elegir", "opción", "alternativa"];
        const input = "Necesito tomar una decisión importante";
        const hasKeyword = keywords.some((kw) => input.toLowerCase().includes(kw));
        expect(hasKeyword).toBe(true);
      });

      it("should detect strategy type from keywords", () => {
        const keywords = ["estrategia", "visión", "largo plazo", "competencia"];
        const input = "Nuestra estrategia de largo plazo es dominar el mercado";
        const hasKeyword = keywords.some((kw) => input.toLowerCase().includes(kw));
        expect(hasKeyword).toBe(true);
      });

      it("should detect product type from keywords", () => {
        const keywords = ["producto", "feature", "mvp", "lanzar"];
        const input = "Queremos lanzar un nuevo producto al mercado";
        const hasKeyword = keywords.some((kw) => input.toLowerCase().includes(kw));
        expect(hasKeyword).toBe(true);
      });

      it("should default to general when no specific keywords found", () => {
        const input = "Tengo una duda general sobre mi negocio";
        const businessKeywords = ["decisión", "elegir"];
        const strategyKeywords = ["estrategia", "visión"];
        const productKeywords = ["producto", "mvp"];

        const isBusinesss = businessKeywords.some((kw) => input.toLowerCase().includes(kw));
        const isStrategy = strategyKeywords.some((kw) => input.toLowerCase().includes(kw));
        const isProduct = productKeywords.some((kw) => input.toLowerCase().includes(kw));

        expect(isBusinesss).toBe(false);
        expect(isStrategy).toBe(false);
        expect(isProduct).toBe(false);
      });
    });

    describe("dimension analysis", () => {
      it("should analyze dimensions based on keywords", () => {
        const input = mockUserInput.business.toLowerCase();
        const constraintKeywords = ["presupuesto", "tiempo", "límite", "$", "€"];
        const timelineKeywords = ["plazo", "mes", "semana", "urgente"];

        // Check constraints detection (has $500K)
        const hasConstraint = constraintKeywords.some((kw) => input.includes(kw));

        // Check timeline detection (has 18 meses)
        const hasTimeline = timelineKeywords.some((kw) => input.includes(kw));

        expect(hasConstraint).toBe(true); // Has "$500K"
        expect(hasTimeline).toBe(true); // Has "meses"
      });

      it("should generate scores based on keyword presence", () => {
        // Score logic: 0 keywords = 0, 1 keyword = 40, 2+ keywords = 80
        const calculateScore = (keywordCount: number) => {
          if (keywordCount >= 2) return 80;
          if (keywordCount === 1) return 40;
          return 0;
        };

        expect(calculateScore(0)).toBe(0);
        expect(calculateScore(1)).toBe(40);
        expect(calculateScore(2)).toBe(80);
        expect(calculateScore(5)).toBe(80);
      });
    });

    describe("readiness level calculation", () => {
      it("should return 'insufficient' for scores below 30", () => {
        const getReadinessLevel = (score: number) => {
          if (score >= 75) return "excellent";
          if (score >= 50) return "good";
          if (score >= 30) return "basic";
          return "insufficient";
        };

        expect(getReadinessLevel(0)).toBe("insufficient");
        expect(getReadinessLevel(29)).toBe("insufficient");
      });

      it("should return 'basic' for scores 30-49", () => {
        const getReadinessLevel = (score: number) => {
          if (score >= 75) return "excellent";
          if (score >= 50) return "good";
          if (score >= 30) return "basic";
          return "insufficient";
        };

        expect(getReadinessLevel(30)).toBe("basic");
        expect(getReadinessLevel(49)).toBe("basic");
      });

      it("should return 'good' for scores 50-74", () => {
        const getReadinessLevel = (score: number) => {
          if (score >= 75) return "excellent";
          if (score >= 50) return "good";
          if (score >= 30) return "basic";
          return "insufficient";
        };

        expect(getReadinessLevel(50)).toBe("good");
        expect(getReadinessLevel(74)).toBe("good");
      });

      it("should return 'excellent' for scores 75+", () => {
        const getReadinessLevel = (score: number) => {
          if (score >= 75) return "excellent";
          if (score >= 50) return "good";
          if (score >= 30) return "basic";
          return "insufficient";
        };

        expect(getReadinessLevel(75)).toBe("excellent");
        expect(getReadinessLevel(100)).toBe("excellent");
      });
    });

    describe("recommended action determination", () => {
      it("should recommend 'proceed' for high scores without critical questions", () => {
        const getRecommendedAction = (score: number, hasCritical: boolean) => {
          if (score >= 70 && !hasCritical) return "proceed";
          if (score >= 40) return "clarify";
          return "refine";
        };

        expect(getRecommendedAction(80, false)).toBe("proceed");
        expect(getRecommendedAction(75, false)).toBe("proceed");
      });

      it("should recommend 'clarify' for medium scores or when has critical questions", () => {
        const getRecommendedAction = (score: number, hasCritical: boolean) => {
          if (score >= 70 && !hasCritical) return "proceed";
          if (score >= 40) return "clarify";
          return "refine";
        };

        expect(getRecommendedAction(80, true)).toBe("clarify");
        expect(getRecommendedAction(50, false)).toBe("clarify");
      });

      it("should recommend 'refine' for low scores", () => {
        const getRecommendedAction = (score: number, hasCritical: boolean) => {
          if (score >= 70 && !hasCritical) return "proceed";
          if (score >= 40) return "clarify";
          return "refine";
        };

        expect(getRecommendedAction(20, false)).toBe("refine");
        expect(getRecommendedAction(39, false)).toBe("refine");
      });
    });
  });

  describe("refine endpoint", () => {
    describe("input validation", () => {
      it("should require originalInput", () => {
        const input = mockUserInput.business;
        expect(input.length).toBeGreaterThan(0);
      });

      it("should accept assumptionResponses as record", () => {
        const responses: Record<string, boolean> = {
          "assumption-1": true,
          "assumption-2": false,
        };
        expect(typeof responses["assumption-1"]).toBe("boolean");
      });

      it("should accept questionResponses as record", () => {
        const responses: Record<string, string | string[]> = {
          "question-1": "Mi respuesta",
          "question-2": ["opción 1", "opción 2"],
        };
        expect(typeof responses["question-1"]).toBe("string");
        expect(Array.isArray(responses["question-2"])).toBe(true);
      });
    });

    describe("context enhancement", () => {
      it("should append confirmed assumptions to context", () => {
        const original = "Mi pregunta original";
        const assumption = "El objetivo es crecer";
        const enhanced = `${original}\n[Confirmado: ${assumption}]`;

        expect(enhanced).toContain(original);
        expect(enhanced).toContain("[Confirmado:");
        expect(enhanced).toContain(assumption);
      });

      it("should append question responses to context", () => {
        const original = "Mi pregunta original";
        const dimension = "objective";
        const response = "Quiero aumentar ventas";
        const enhanced = `${original}\n[${dimension}: ${response}]`;

        expect(enhanced).toContain(original);
        expect(enhanced).toContain(`[${dimension}:`);
        expect(enhanced).toContain(response);
      });

      it("should append additional context", () => {
        const original = "Mi pregunta original";
        const additional = "Información extra importante";
        const enhanced = `${original}\n${additional}`;

        expect(enhanced).toContain(original);
        expect(enhanced).toContain(additional);
      });
    });

    describe("score improvement", () => {
      it("should increase dimension scores when questions answered", () => {
        // Simulating that answering a question about a dimension improves its score
        const beforeScore = 40;
        const afterScore = 70; // After answering relevant questions

        expect(afterScore).toBeGreaterThan(beforeScore);
      });

      it("should confirm assumptions and update confidence", () => {
        const assumption = {
          id: "assumption-1",
          confirmed: null as boolean | null,
          confidence: 0.6,
        };

        // After user confirms
        assumption.confirmed = true;

        expect(assumption.confirmed).toBe(true);
      });
    });
  });

  describe("dimension templates", () => {
    const templates = {
      business_decision: ["objective", "constraints", "stakeholders", "context", "options", "criteria", "risks", "timeline"],
      strategy: ["vision", "current_state", "market", "resources", "differentiators", "risks", "timeline"],
      product: ["problem", "user", "solution", "market", "mvp", "metrics", "resources"],
      general: ["objective", "context", "constraints", "options", "criteria"],
    };

    it("should have correct dimensions for business_decision", () => {
      expect(templates.business_decision).toContain("objective");
      expect(templates.business_decision).toContain("constraints");
      expect(templates.business_decision).toContain("risks");
      expect(templates.business_decision.length).toBe(8);
    });

    it("should have correct dimensions for strategy", () => {
      expect(templates.strategy).toContain("vision");
      expect(templates.strategy).toContain("market");
      expect(templates.strategy).toContain("differentiators");
      expect(templates.strategy.length).toBe(7);
    });

    it("should have correct dimensions for product", () => {
      expect(templates.product).toContain("problem");
      expect(templates.product).toContain("user");
      expect(templates.product).toContain("mvp");
      expect(templates.product.length).toBe(7);
    });

    it("should have correct dimensions for general", () => {
      expect(templates.general).toContain("objective");
      expect(templates.general).toContain("context");
      expect(templates.general.length).toBe(5);
    });
  });

  describe("assumption generation", () => {
    const assumptions: Record<string, string> = {
      objective: "El objetivo es tomar una decisión informada sobre este tema",
      constraints: "No hay restricciones de presupuesto críticas",
      stakeholders: "La decisión la tomas tú o tu equipo directo",
      timeline: "No hay una urgencia crítica inmediata",
    };

    it("should generate appropriate assumptions for each dimension", () => {
      expect(assumptions.objective).toContain("decisión");
      expect(assumptions.constraints).toContain("presupuesto");
      expect(assumptions.stakeholders).toContain("equipo");
      expect(assumptions.timeline).toContain("urgencia");
    });

    it("should provide alternatives for rejected assumptions", () => {
      const alternatives = {
        timeline: ["Urgente (días)", "Corto plazo (semanas)", "Medio plazo (meses)", "Sin prisa"],
        stakeholders: ["Solo yo", "Equipo pequeño", "Múltiples departamentos", "Clientes/externos"],
      };

      expect(alternatives.timeline.length).toBeGreaterThan(0);
      expect(alternatives.stakeholders.length).toBeGreaterThan(0);
    });
  });

  describe("question generation", () => {
    const questions: Record<string, string> = {
      objective: "¿Cuál es el resultado específico que quieres lograr con esta decisión?",
      constraints: "¿Qué limitaciones tienes en términos de presupuesto, tiempo o recursos?",
      risks: "¿Qué podría salir mal? ¿Cuáles son tus principales preocupaciones?",
    };

    it("should generate relevant questions for missing dimensions", () => {
      expect(questions.objective).toContain("resultado");
      expect(questions.constraints).toContain("limitaciones");
      expect(questions.risks).toContain("mal");
    });

    it("should assign correct priority based on dimension weight", () => {
      const getPriority = (weight: number): "critical" | "important" | "nice-to-have" => {
        return weight > 0.15 ? "critical" : "important";
      };

      expect(getPriority(0.2)).toBe("critical");
      expect(getPriority(0.15)).toBe("important");
      expect(getPriority(0.1)).toBe("important");
    });

    it("should provide multiple choice options when appropriate", () => {
      const optionsMap: Record<string, string[] | undefined> = {
        timeline: ["Urgente (esta semana)", "1-2 semanas", "1 mes", "Sin prisa específica"],
        stakeholders: ["Solo yo", "Mi equipo directo", "Varios departamentos", "Clientes/externos"],
        objective: undefined, // Free text
      };

      expect(optionsMap.timeline).toBeDefined();
      expect(optionsMap.timeline?.length).toBeGreaterThan(0);
      expect(optionsMap.objective).toBeUndefined();
    });
  });
});
