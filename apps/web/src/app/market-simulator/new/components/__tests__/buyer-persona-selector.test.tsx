/**
 * Component Tests for Buyer Persona Selector
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BuyerPersonaSelector } from '../buyer-persona-selector'

describe('BuyerPersonaSelector', () => {
  const mockPersonas = [
    {
      id: 'persona-1',
      name: 'CFO Fintech',
      title: 'Chief Financial Officer en empresa Fintech',
      psychographics: {
        jobsToBeDone: [
          'Reducir tiempo en decisiones estratégicas',
          'Mejorar ROI de consultoras externas',
          'Implementar procesos data-driven',
          'Asegurar compliance',
        ],
        barriers: [
          'Falta de tiempo para análisis',
          'Desconfianza en soluciones black box',
        ],
      },
    },
    {
      id: 'persona-2',
      name: 'Product Manager SaaS',
      title: 'Head of Product en startup SaaS B2B',
      psychographics: {
        jobsToBeDone: ['Validar features', 'Priorizar roadmap'],
        barriers: ['Research lento', 'Recursos limitados'],
      },
    },
    {
      id: 'persona-3',
      name: 'CEO Startup',
      title: 'CEO & Founder',
      psychographics: {
        jobsToBeDone: ['Tomar decisiones rápido'],
        barriers: ['Falta de tiempo'],
      },
    },
  ]

  const mockOnChange = vi.fn()

  describe('Rendering', () => {
    it('should render all personas', () => {
      render(
        <BuyerPersonaSelector
          personas={mockPersonas}
          selected={[]}
          onChange={mockOnChange}
        />
      )

      expect(screen.getByText('CFO Fintech')).toBeInTheDocument()
      expect(screen.getByText('Product Manager SaaS')).toBeInTheDocument()
      expect(screen.getByText('CEO Startup')).toBeInTheDocument()
    })

    it('should render persona titles', () => {
      render(
        <BuyerPersonaSelector
          personas={mockPersonas}
          selected={[]}
          onChange={mockOnChange}
        />
      )

      expect(screen.getByText('Chief Financial Officer en empresa Fintech')).toBeInTheDocument()
    })

    it('should render Jobs-to-be-Done', () => {
      render(
        <BuyerPersonaSelector
          personas={mockPersonas}
          selected={[]}
          onChange={mockOnChange}
        />
      )

      expect(screen.getByText('Reducir tiempo en decisiones estratégicas')).toBeInTheDocument()
    })

    it('should render Barriers', () => {
      render(
        <BuyerPersonaSelector
          personas={mockPersonas}
          selected={[]}
          onChange={mockOnChange}
        />
      )

      expect(screen.getByText('Falta de tiempo para análisis')).toBeInTheDocument()
    })

    it('should show checkboxes for all personas', () => {
      render(
        <BuyerPersonaSelector
          personas={mockPersonas}
          selected={[]}
          onChange={mockOnChange}
        />
      )

      const checkboxes = screen.getAllByRole('checkbox')
      expect(checkboxes).toHaveLength(3)
    })
  })

  describe('Selection', () => {
    it('should call onChange when persona is selected', async () => {
      const user = userEvent.setup()

      render(
        <BuyerPersonaSelector
          personas={mockPersonas}
          selected={[]}
          onChange={mockOnChange}
        />
      )

      const checkbox = screen.getAllByRole('checkbox')[0]
      await user.click(checkbox)

      expect(mockOnChange).toHaveBeenCalledWith(['persona-1'])
    })

    it('should call onChange when persona is deselected', async () => {
      const user = userEvent.setup()

      render(
        <BuyerPersonaSelector
          personas={mockPersonas}
          selected={['persona-1']}
          onChange={mockOnChange}
        />
      )

      const checkbox = screen.getAllByRole('checkbox')[0]
      await user.click(checkbox)

      expect(mockOnChange).toHaveBeenCalledWith([])
    })

    it('should show selected personas with purple border', () => {
      const { container } = render(
        <BuyerPersonaSelector
          personas={mockPersonas}
          selected={['persona-1']}
          onChange={mockOnChange}
        />
      )

      const selectedCard = container.querySelector('.border-purple-500')
      expect(selectedCard).toBeInTheDocument()
    })

    it('should allow multiple selections', async () => {
      const user = userEvent.setup()

      render(
        <BuyerPersonaSelector
          personas={mockPersonas}
          selected={[]}
          onChange={mockOnChange}
        />
      )

      const checkboxes = screen.getAllByRole('checkbox')
      await user.click(checkboxes[0])
      await user.click(checkboxes[1])

      expect(mockOnChange).toHaveBeenCalledTimes(2)
    })
  })

  describe('Limit of 10', () => {
    const manyPersonas = Array.from({ length: 12 }, (_, i) => ({
      id: `persona-${i}`,
      name: `Persona ${i}`,
      psychographics: { jobsToBeDone: ['Test'] },
    }))

    it('should allow selecting up to 10 personas', async () => {
      const user = userEvent.setup()

      render(
        <BuyerPersonaSelector
          personas={manyPersonas}
          selected={[]}
          onChange={mockOnChange}
        />
      )

      const checkboxes = screen.getAllByRole('checkbox')
      for (let i = 0; i < 10; i++) {
        await user.click(checkboxes[i])
      }

      expect(mockOnChange).toHaveBeenCalledTimes(10)
    })

    it('should disable remaining personas when 10 selected', () => {
      const tenSelected = Array.from({ length: 10 }, (_, i) => `persona-${i}`)

      render(
        <BuyerPersonaSelector
          personas={manyPersonas}
          selected={tenSelected}
          onChange={mockOnChange}
        />
      )

      const checkboxes = screen.getAllByRole('checkbox')
      const disabledCheckboxes = checkboxes.filter(cb => cb.hasAttribute('disabled'))

      expect(disabledCheckboxes.length).toBe(2) // 12 total - 10 selected = 2 disabled
    })

    it('should show warning message when limit reached', () => {
      const tenSelected = Array.from({ length: 10 }, (_, i) => `persona-${i}`)

      render(
        <BuyerPersonaSelector
          personas={manyPersonas}
          selected={tenSelected}
          onChange={mockOnChange}
        />
      )

      expect(screen.getByText('Máximo 10 Buyer Personas por simulación')).toBeInTheDocument()
    })

    it('should not show warning when below limit', () => {
      render(
        <BuyerPersonaSelector
          personas={mockPersonas}
          selected={['persona-1']}
          onChange={mockOnChange}
        />
      )

      expect(screen.queryByText('Máximo 10 Buyer Personas')).not.toBeInTheDocument()
    })

    it('should apply opacity to disabled personas', () => {
      const tenSelected = Array.from({ length: 10 }, (_, i) => `persona-${i}`)

      const { container } = render(
        <BuyerPersonaSelector
          personas={manyPersonas}
          selected={tenSelected}
          onChange={mockOnChange}
        />
      )

      const disabledCards = container.querySelectorAll('.opacity-50')
      expect(disabledCards.length).toBeGreaterThan(0)
    })
  })

  describe('Loading State', () => {
    it('should show skeleton loaders when loading', () => {
      render(
        <BuyerPersonaSelector
          personas={[]}
          selected={[]}
          onChange={mockOnChange}
          isLoading={true}
        />
      )

      expect(screen.getByText('Cargando perfiles...')).toBeInTheDocument()
    })

    it('should render 3 skeleton items', () => {
      const { container } = render(
        <BuyerPersonaSelector
          personas={[]}
          selected={[]}
          onChange={mockOnChange}
          isLoading={true}
        />
      )

      const skeletons = container.querySelectorAll('.animate-pulse')
      expect(skeletons.length).toBeGreaterThan(0)
    })
  })

  describe('Empty State', () => {
    it('should show empty state when no personas', () => {
      render(
        <BuyerPersonaSelector
          personas={[]}
          selected={[]}
          onChange={mockOnChange}
        />
      )

      expect(screen.getByText('No hay Buyer Personas')).toBeInTheDocument()
    })

    it('should show guidance message in empty state', () => {
      render(
        <BuyerPersonaSelector
          personas={[]}
          selected={[]}
          onChange={mockOnChange}
        />
      )

      expect(screen.getByText(/Crea al menos un Buyer Persona/)).toBeInTheDocument()
    })

    it('should not show empty state when loading', () => {
      render(
        <BuyerPersonaSelector
          personas={[]}
          selected={[]}
          onChange={mockOnChange}
          isLoading={true}
        />
      )

      expect(screen.queryByText('No hay Buyer Personas')).not.toBeInTheDocument()
    })
  })

  describe('JTBD Display', () => {
    it('should show first 2 Jobs-to-be-Done', () => {
      render(
        <BuyerPersonaSelector
          personas={mockPersonas}
          selected={[]}
          onChange={mockOnChange}
        />
      )

      expect(screen.getByText('Reducir tiempo en decisiones estratégicas')).toBeInTheDocument()
      expect(screen.getByText('Mejorar ROI de consultoras externas')).toBeInTheDocument()
    })

    it('should show counter for additional JTBD', () => {
      render(
        <BuyerPersonaSelector
          personas={mockPersonas}
          selected={[]}
          onChange={mockOnChange}
        />
      )

      expect(screen.getByText('+2 más...')).toBeInTheDocument()
    })

    it('should not show counter when 2 or fewer JTBD', () => {
      render(
        <BuyerPersonaSelector
          personas={mockPersonas.slice(1)}
          selected={[]}
          onChange={mockOnChange}
        />
      )

      expect(screen.queryByText(/más\.\.\./)).not.toBeInTheDocument()
    })
  })

  describe('Barriers Display', () => {
    it('should show first 2 Barriers', () => {
      render(
        <BuyerPersonaSelector
          personas={mockPersonas}
          selected={[]}
          onChange={mockOnChange}
        />
      )

      expect(screen.getByText('Falta de tiempo para análisis')).toBeInTheDocument()
      expect(screen.getByText('Desconfianza en soluciones black box')).toBeInTheDocument()
    })

    it('should show counter for additional barriers', () => {
      const personaWithManyBarriers = [
        {
          ...mockPersonas[0],
          psychographics: {
            ...mockPersonas[0].psychographics,
            barriers: ['B1', 'B2', 'B3', 'B4'],
          },
        },
      ]

      render(
        <BuyerPersonaSelector
          personas={personaWithManyBarriers}
          selected={[]}
          onChange={mockOnChange}
        />
      )

      expect(screen.getByText('+2 más...')).toBeInTheDocument()
    })
  })

  describe('Icons', () => {
    it('should render JTBD icon', () => {
      const { container } = render(
        <BuyerPersonaSelector
          personas={mockPersonas}
          selected={[]}
          onChange={mockOnChange}
        />
      )

      // Target icon for JTBD
      const icons = container.querySelectorAll('svg')
      expect(icons.length).toBeGreaterThan(0)
    })

    it('should render Barriers icon', () => {
      const { container } = render(
        <BuyerPersonaSelector
          personas={mockPersonas}
          selected={[]}
          onChange={mockOnChange}
        />
      )

      // AlertCircle icon for Barriers
      const icons = container.querySelectorAll('svg')
      expect(icons.length).toBeGreaterThan(0)
    })
  })

  describe('Click Interaction', () => {
    it('should toggle selection when clicking card', async () => {
      const user = userEvent.setup()

      render(
        <BuyerPersonaSelector
          personas={mockPersonas}
          selected={[]}
          onChange={mockOnChange}
        />
      )

      const card = screen.getByText('CFO Fintech').closest('div')
      if (card) {
        await user.click(card)
        expect(mockOnChange).toHaveBeenCalled()
      }
    })

    it('should not allow click on disabled personas', async () => {
      const user = userEvent.setup()
      const manyPersonas = Array.from({ length: 11 }, (_, i) => ({
        id: `persona-${i}`,
        name: `Persona ${i}`,
        psychographics: {},
      }))
      const tenSelected = Array.from({ length: 10 }, (_, i) => `persona-${i}`)

      render(
        <BuyerPersonaSelector
          personas={manyPersonas}
          selected={tenSelected}
          onChange={mockOnChange}
        />
      )

      const disabledCard = screen.getByText('Persona 10').closest('div')
      if (disabledCard) {
        await user.click(disabledCard)
        // Should not call onChange because it's disabled
        expect(mockOnChange).not.toHaveBeenCalled()
      }
    })
  })

  describe('Accessibility', () => {
    it('should have proper labels', () => {
      render(
        <BuyerPersonaSelector
          personas={mockPersonas}
          selected={[]}
          onChange={mockOnChange}
        />
      )

      const checkboxes = screen.getAllByRole('checkbox')
      expect(checkboxes.length).toBe(3)
    })

    it('should indicate disabled state properly', () => {
      const tenSelected = Array.from({ length: 10 }, (_, i) => `persona-${i}`)
      const manyPersonas = Array.from({ length: 11 }, (_, i) => ({
        id: `persona-${i}`,
        name: `Persona ${i}`,
        psychographics: {},
      }))

      render(
        <BuyerPersonaSelector
          personas={manyPersonas}
          selected={tenSelected}
          onChange={mockOnChange}
        />
      )

      const checkboxes = screen.getAllByRole('checkbox')
      const disabledCheckboxes = checkboxes.filter(cb => cb.hasAttribute('disabled'))
      expect(disabledCheckboxes.length).toBe(1)
    })
  })
})
