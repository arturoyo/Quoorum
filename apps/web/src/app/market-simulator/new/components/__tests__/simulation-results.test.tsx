/**
 * Component Tests for Simulation Results
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SimulationResults } from '../simulation-results'

describe('SimulationResults', () => {
  const mockResult = {
    winningVariant: {
      index: 0,
      text: 'Toma decisiones estratégicas en minutos',
      consensusScore: 76.5,
      avgFriction: 3.2,
    },
    frictionMap: [
      {
        personaId: 'persona-1',
        personaName: 'CFO Fintech',
        variantIndex: 0,
        frictionScore: 3,
        rejectionArgument: 'Baja fricción, mensaje resuena con necesidad de eficiencia',
        alignment: {
          jobsToBeDone: 8,
          barrierReduction: 7,
        },
      },
      {
        personaId: 'persona-1',
        personaName: 'CFO Fintech',
        variantIndex: 1,
        frictionScore: 6,
        rejectionArgument: 'Fricción moderada, falta claridad en propuesta',
        alignment: {
          jobsToBeDone: 5,
          barrierReduction: 4,
        },
      },
      {
        personaId: 'persona-2',
        personaName: 'Product Manager',
        variantIndex: 0,
        frictionScore: 4,
        rejectionArgument: 'Fricción moderada, buen enfoque pero falta mención de datos',
        alignment: {
          jobsToBeDone: 6,
          barrierReduction: 5,
        },
      },
      {
        personaId: 'persona-2',
        personaName: 'Product Manager',
        variantIndex: 1,
        frictionScore: 7,
        rejectionArgument: 'Alta fricción, no resuena con workflow de producto',
        alignment: {
          jobsToBeDone: 3,
          barrierReduction: 3,
        },
      },
    ],
    synthesis: 'La Variante 1 logra el mejor balance entre claridad y promesa de valor. Resalta dos pain points críticos: tiempo desperdiciado en decisiones y dependencia de consultoras externas.',
    costBreakdown: {
      evaluationCost: 0.0015,
      synthesisCost: 0.005,
      totalCost: 0.0065,
      totalTokens: 8420,
    },
    executionTime: 16800,
  }

  const mockPersonas = [
    { id: 'persona-1', name: 'CFO Fintech' },
    { id: 'persona-2', name: 'Product Manager' },
  ]

  const mockVariants = [
    'Toma decisiones estratégicas en minutos',
    'IA que debate por ti',
  ]

  describe('Stats Cards', () => {
    it('should display winning variant number', () => {
      render(
        <SimulationResults
          result={mockResult}
          personas={mockPersonas}
          variants={mockVariants}
        />
      )

      expect(screen.getByText('#1')).toBeInTheDocument()
    })

    it('should display consensus score', () => {
      render(
        <SimulationResults
          result={mockResult}
          personas={mockPersonas}
          variants={mockVariants}
        />
      )

      expect(screen.getByText('76.5%')).toBeInTheDocument()
    })

    it('should display average friction', () => {
      render(
        <SimulationResults
          result={mockResult}
          personas={mockPersonas}
          variants={mockVariants}
        />
      )

      expect(screen.getByText('3.2/10')).toBeInTheDocument()
    })

    it('should display total cost', () => {
      render(
        <SimulationResults
          result={mockResult}
          personas={mockPersonas}
          variants={mockVariants}
        />
      )

      expect(screen.getByText('$0.0065')).toBeInTheDocument()
    })

    it('should display execution time in seconds', () => {
      render(
        <SimulationResults
          result={mockResult}
          personas={mockPersonas}
          variants={mockVariants}
        />
      )

      expect(screen.getByText('16.8s')).toBeInTheDocument()
    })

    it('should display token count', () => {
      render(
        <SimulationResults
          result={mockResult}
          personas={mockPersonas}
          variants={mockVariants}
        />
      )

      expect(screen.getByText('8,420 tokens')).toBeInTheDocument()
    })
  })

  describe('Synthesis Section', () => {
    it('should display AI synthesis', () => {
      render(
        <SimulationResults
          result={mockResult}
          personas={mockPersonas}
          variants={mockVariants}
        />
      )

      expect(screen.getByText(/La Variante 1 logra el mejor balance/)).toBeInTheDocument()
    })

    it('should have synthesis title', () => {
      render(
        <SimulationResults
          result={mockResult}
          personas={mockPersonas}
          variants={mockVariants}
        />
      )

      expect(screen.getByText('Síntesis de IA')).toBeInTheDocument()
    })
  })

  describe('Variant Comparison', () => {
    it('should display all variants', () => {
      render(
        <SimulationResults
          result={mockResult}
          personas={mockPersonas}
          variants={mockVariants}
        />
      )

      expect(screen.getByText('Toma decisiones estratégicas en minutos')).toBeInTheDocument()
      expect(screen.getByText('IA que debate por ti')).toBeInTheDocument()
    })

    it('should mark winning variant', () => {
      render(
        <SimulationResults
          result={mockResult}
          personas={mockPersonas}
          variants={mockVariants}
        />
      )

      expect(screen.getByText('Variante #1 (Ganadora)')).toBeInTheDocument()
    })

    it('should show variant badges', () => {
      render(
        <SimulationResults
          result={mockResult}
          personas={mockPersonas}
          variants={mockVariants}
        />
      )

      expect(screen.getByText('Variante #1 (Ganadora)')).toBeInTheDocument()
      expect(screen.getByText('Variante #2')).toBeInTheDocument()
    })
  })

  describe('Friction Color Coding', () => {
    it('should use green for low friction (1-3)', () => {
      const { container } = render(
        <SimulationResults
          result={mockResult}
          personas={mockPersonas}
          variants={mockVariants}
        />
      )

      const greenElements = container.querySelectorAll('.text-green-400')
      expect(greenElements.length).toBeGreaterThan(0)
    })

    it('should use yellow for moderate friction (4-6)', () => {
      const { container } = render(
        <SimulationResults
          result={mockResult}
          personas={mockPersonas}
          variants={mockVariants}
        />
      )

      const yellowElements = container.querySelectorAll('.text-yellow-400')
      expect(yellowElements.length).toBeGreaterThan(0)
    })

    it('should use red for high friction (7-10)', () => {
      const { container } = render(
        <SimulationResults
          result={mockResult}
          personas={mockPersonas}
          variants={mockVariants}
        />
      )

      const redElements = container.querySelectorAll('.text-red-400')
      expect(redElements.length).toBeGreaterThan(0)
    })
  })

  describe('Avatar Indicators', () => {
    it('should render persona avatars', () => {
      const { container } = render(
        <SimulationResults
          result={mockResult}
          personas={mockPersonas}
          variants={mockVariants}
        />
      )

      // Avatars with initials
      expect(screen.getByText('CF')).toBeInTheDocument() // CFO Fintech
      expect(screen.getByText('PR')).toBeInTheDocument() // Product Manager
    })

    it('should show green indicator for low friction', () => {
      const { container } = render(
        <SimulationResults
          result={mockResult}
          personas={mockPersonas}
          variants={mockVariants}
        />
      )

      const greenIndicators = container.querySelectorAll('.bg-green-500')
      expect(greenIndicators.length).toBeGreaterThan(0)
    })

    it('should show red indicator for high friction', () => {
      const { container } = render(
        <SimulationResults
          result={mockResult}
          personas={mockPersonas}
          variants={mockVariants}
        />
      )

      const redIndicators = container.querySelectorAll('.bg-red-500')
      expect(redIndicators.length).toBeGreaterThan(0)
    })

    it('should display persona names', () => {
      render(
        <SimulationResults
          result={mockResult}
          personas={mockPersonas}
          variants={mockVariants}
        />
      )

      expect(screen.getAllByText('CFO Fintech').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Product Manager').length).toBeGreaterThan(0)
    })
  })

  describe('Cost Breakdown', () => {
    it('should show evaluation cost', () => {
      render(
        <SimulationResults
          result={mockResult}
          personas={mockPersonas}
          variants={mockVariants}
        />
      )

      expect(screen.getByText('$0.0015')).toBeInTheDocument()
    })

    it('should show synthesis cost', () => {
      render(
        <SimulationResults
          result={mockResult}
          personas={mockPersonas}
          variants={mockVariants}
        />
      )

      expect(screen.getByText('$0.0050')).toBeInTheDocument()
    })

    it('should show number of evaluations', () => {
      render(
        <SimulationResults
          result={mockResult}
          personas={mockPersonas}
          variants={mockVariants}
        />
      )

      expect(screen.getByText(/Evaluaciones \(4\)/)).toBeInTheDocument()
    })

    it('should have cost breakdown section', () => {
      render(
        <SimulationResults
          result={mockResult}
          personas={mockPersonas}
          variants={mockVariants}
        />
      )

      expect(screen.getByText('Desglose de Costes')).toBeInTheDocument()
    })
  })

  describe('Tooltips', () => {
    it('should show rejection argument in tooltip', async () => {
      render(
        <SimulationResults
          result={mockResult}
          personas={mockPersonas}
          variants={mockVariants}
        />
      )

      // Tooltips should contain rejection arguments
      expect(screen.getByText(/Baja fricción, mensaje resuena/)).toBeInTheDocument()
    })

    it('should show alignment scores in tooltip', () => {
      render(
        <SimulationResults
          result={mockResult}
          personas={mockPersonas}
          variants={mockVariants}
        />
      )

      expect(screen.getByText('JTBD Alignment:')).toBeInTheDocument()
      expect(screen.getByText('Barrier Reduction:')).toBeInTheDocument()
    })

    it('should display scores out of 10', () => {
      render(
        <SimulationResults
          result={mockResult}
          personas={mockPersonas}
          variants={mockVariants}
        />
      )

      expect(screen.getByText('8/10')).toBeInTheDocument()
      expect(screen.getByText('7/10')).toBeInTheDocument()
    })
  })

  describe('Responsive Grid', () => {
    it('should use grid layout for stats', () => {
      const { container } = render(
        <SimulationResults
          result={mockResult}
          personas={mockPersonas}
          variants={mockVariants}
        />
      )

      const grid = container.querySelector('.grid')
      expect(grid).toBeInTheDocument()
    })
  })

  describe('Friction Labels', () => {
    it('should show "Baja fricción" label for score <= 3', () => {
      render(
        <SimulationResults
          result={mockResult}
          personas={mockPersonas}
          variants={mockVariants}
        />
      )

      expect(screen.getByText('Baja fricción')).toBeInTheDocument()
    })

    it('should show appropriate friction label', () => {
      const { container } = render(
        <SimulationResults
          result={mockResult}
          personas={mockPersonas}
          variants={mockVariants}
        />
      )

      // Should have friction labels in the document
      const labels = container.textContent
      expect(labels).toContain('fricción')
    })
  })

  describe('Edge Cases', () => {
    it('should handle single variant', () => {
      const singleVariantResult = {
        ...mockResult,
        frictionMap: mockResult.frictionMap.filter(f => f.variantIndex === 0),
      }

      render(
        <SimulationResults
          result={singleVariantResult}
          personas={mockPersonas}
          variants={[mockVariants[0]]}
        />
      )

      expect(screen.getByText('Variante #1 (Ganadora)')).toBeInTheDocument()
    })

    it('should handle single persona', () => {
      const singlePersonaResult = {
        ...mockResult,
        frictionMap: mockResult.frictionMap.filter(f => f.personaId === 'persona-1'),
      }

      render(
        <SimulationResults
          result={singlePersonaResult}
          personas={[mockPersonas[0]]}
          variants={mockVariants}
        />
      )

      expect(screen.getAllByText('CFO Fintech').length).toBeGreaterThan(0)
    })

    it('should handle maximum friction score (10)', () => {
      const maxFrictionResult = {
        ...mockResult,
        frictionMap: [
          {
            ...mockResult.frictionMap[0],
            frictionScore: 10,
          },
        ],
      }

      render(
        <SimulationResults
          result={maxFrictionResult}
          personas={mockPersonas}
          variants={mockVariants}
        />
      )

      expect(screen.getByText('10/10')).toBeInTheDocument()
    })

    it('should handle minimum friction score (1)', () => {
      const minFrictionResult = {
        ...mockResult,
        frictionMap: [
          {
            ...mockResult.frictionMap[0],
            frictionScore: 1,
          },
        ],
      }

      render(
        <SimulationResults
          result={minFrictionResult}
          personas={mockPersonas}
          variants={mockVariants}
        />
      )

      expect(screen.getByText(/1\/10/)).toBeInTheDocument()
    })
  })

  describe('Icons', () => {
    it('should render stats card icons', () => {
      const { container } = render(
        <SimulationResults
          result={mockResult}
          personas={mockPersonas}
          variants={mockVariants}
        />
      )

      // Trophy, Target, DollarSign, Clock icons
      const icons = container.querySelectorAll('svg')
      expect(icons.length).toBeGreaterThan(4)
    })
  })

  describe('Accessibility', () => {
    it('should have proper headings', () => {
      render(
        <SimulationResults
          result={mockResult}
          personas={mockPersonas}
          variants={mockVariants}
        />
      )

      expect(screen.getByText('Síntesis de IA')).toBeInTheDocument()
      expect(screen.getByText('Comparativa de Variantes')).toBeInTheDocument()
    })

    it('should have descriptive labels', () => {
      render(
        <SimulationResults
          result={mockResult}
          personas={mockPersonas}
          variants={mockVariants}
        />
      )

      expect(screen.getByText('Variante Ganadora')).toBeInTheDocument()
      expect(screen.getByText('Fricción Promedio')).toBeInTheDocument()
      expect(screen.getByText('Coste Total')).toBeInTheDocument()
    })
  })
})
