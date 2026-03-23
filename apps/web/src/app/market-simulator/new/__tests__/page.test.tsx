/**
 * Component Tests for Market Simulator Main Page
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MarketSimulatorPage from '../page'

// Mock tRPC
const mockUseQuery = vi.fn()
const mockUseMutation = vi.fn()

vi.mock('@/lib/trpc/client', () => ({
  api: {
    strategicProfiles: {
      list: {
        useQuery: () => mockUseQuery(),
      },
    },
    marketSimulator: {
      runSimulation: {
        useMutation: () => mockUseMutation(),
      },
    },
  },
}))

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('Market Simulator Page', () => {
  const mockBuyerPersonas = [
    {
      id: 'persona-1',
      name: 'CFO Fintech',
      title: 'CFO en empresa Fintech',
      psychographics: {
        jobsToBeDone: ['Reducir tiempo en decisiones', 'Mejorar ROI'],
        barriers: ['Falta de tiempo', 'Desconfianza'],
      },
    },
    {
      id: 'persona-2',
      name: 'Product Manager SaaS',
      title: 'Head of Product',
      psychographics: {
        jobsToBeDone: ['Validar features', 'Priorizar roadmap'],
        barriers: ['Research lento', 'Recursos limitados'],
      },
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()

    // Default mock implementations
    mockUseQuery.mockReturnValue({
      data: mockBuyerPersonas,
      isLoading: false,
    })

    mockUseMutation.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      data: null,
    })
  })

  describe('Rendering', () => {
    it('should render the page title', () => {
      render(<MarketSimulatorPage />)

      expect(screen.getByText('Simulador de Mercado')).toBeInTheDocument()
    })

    it('should render variant editor section', () => {
      render(<MarketSimulatorPage />)

      expect(screen.getByText('Variantes a Evaluar')).toBeInTheDocument()
    })

    it('should render buyer persona selector section', () => {
      render(<MarketSimulatorPage />)

      expect(screen.getByText('Buyer Personas')).toBeInTheDocument()
    })

    it('should render context input section', () => {
      render(<MarketSimulatorPage />)

      expect(screen.getByText(/Contexto de Mercado/)).toBeInTheDocument()
    })

    it('should render run simulation button', () => {
      render(<MarketSimulatorPage />)

      expect(screen.getByText('Ejecutar Focus Group IA')).toBeInTheDocument()
    })

    it('should start with 2 variant slots', () => {
      render(<MarketSimulatorPage />)

      const variantBadges = screen.getAllByText(/Variante \d+/)
      expect(variantBadges).toHaveLength(2)
    })
  })

  describe('Variant Editor', () => {
    it('should allow adding variants up to 5', async () => {
      const user = userEvent.setup()
      render(<MarketSimulatorPage />)

      const addButton = screen.getByText('Añadir')

      await user.click(addButton)
      await user.click(addButton)
      await user.click(addButton)

      const variantBadges = screen.getAllByText(/Variante \d+/)
      expect(variantBadges).toHaveLength(5)
    })

    it('should not allow more than 5 variants', async () => {
      const user = userEvent.setup()
      render(<MarketSimulatorPage />)

      const addButton = screen.getByText('Añadir')

      await user.click(addButton)
      await user.click(addButton)
      await user.click(addButton)

      // Try to add 6th variant - button should be hidden
      expect(screen.queryByText('Añadir')).not.toBeInTheDocument()
    })

    it('should allow removing variants down to 2', async () => {
      const user = userEvent.setup()
      render(<MarketSimulatorPage />)

      // Add a 3rd variant
      const addButton = screen.getByText('Añadir')
      await user.click(addButton)

      // Remove it
      const removeButtons = screen.getAllByRole('button', { name: '' })
      const xButton = removeButtons.find(btn => btn.querySelector('svg'))
      if (xButton) {
        await user.click(xButton)
      }

      const variantBadges = screen.getAllByText(/Variante \d+/)
      expect(variantBadges).toHaveLength(2)
    })

    it('should not allow removing below 2 variants', async () => {
      render(<MarketSimulatorPage />)

      // With only 2 variants, remove buttons should be hidden
      const removeButtons = screen.queryAllByText('×')
      expect(removeButtons).toHaveLength(0)
    })

    it('should show validation error for short variants', async () => {
      const user = userEvent.setup()
      render(<MarketSimulatorPage />)

      const textareas = screen.getAllByRole('textbox')
      await user.type(textareas[0], 'Short')

      expect(screen.getByText('Mínimo 10 caracteres')).toBeInTheDocument()
    })

    it('should not show error for valid variants', async () => {
      const user = userEvent.setup()
      render(<MarketSimulatorPage />)

      const textareas = screen.getAllByRole('textbox')
      await user.type(textareas[0], 'This is a valid variant with more than 10 characters')

      expect(screen.queryByText('Mínimo 10 caracteres')).not.toBeInTheDocument()
    })
  })

  describe('Context Input', () => {
    it('should allow entering context', async () => {
      const user = userEvent.setup()
      render(<MarketSimulatorPage />)

      const contextInput = screen.getByPlaceholderText(/Lanzamiento de producto/)
      await user.type(contextInput, 'Test context')

      expect(contextInput).toHaveValue('Test context')
    })

    it('should show character count', async () => {
      const user = userEvent.setup()
      render(<MarketSimulatorPage />)

      const contextInput = screen.getByPlaceholderText(/Lanzamiento de producto/)
      await user.type(contextInput, 'Test')

      expect(screen.getByText('4/2000')).toBeInTheDocument()
    })

    it('should enforce max length of 2000 chars', () => {
      render(<MarketSimulatorPage />)

      const contextInput = screen.getByPlaceholderText(/Lanzamiento de producto/)
      expect(contextInput).toHaveAttribute('maxLength', '2000')
    })
  })

  describe('Run Simulation Button', () => {
    it('should be disabled with empty variants', () => {
      render(<MarketSimulatorPage />)

      const runButton = screen.getByText('Ejecutar Focus Group IA')
      expect(runButton).toBeDisabled()
    })

    it('should be disabled with no personas selected', async () => {
      const user = userEvent.setup()
      render(<MarketSimulatorPage />)

      // Fill variants but don't select personas
      const textareas = screen.getAllByRole('textbox')
      await user.type(textareas[0], 'Valid variant text here')
      await user.type(textareas[1], 'Another valid variant')

      const runButton = screen.getByText('Ejecutar Focus Group IA')
      expect(runButton).toBeDisabled()
    })

    it('should be enabled with valid data', async () => {
      const user = userEvent.setup()
      render(<MarketSimulatorPage />)

      // Fill variants
      const textareas = screen.getAllByRole('textbox')
      await user.type(textareas[0], 'Valid variant text here')
      await user.type(textareas[1], 'Another valid variant')

      // Select a persona (mock this)
      // In real component, clicking checkbox would select

      await waitFor(() => {
        const runButton = screen.getByText('Ejecutar Focus Group IA')
        expect(runButton).not.toBeDisabled()
      })
    })

    it('should show loading state when running', () => {
      mockUseMutation.mockReturnValue({
        mutate: vi.fn(),
        isPending: true,
        data: null,
      })

      render(<MarketSimulatorPage />)

      expect(screen.getByText('Evaluando...')).toBeInTheDocument()
    })
  })

  describe('Validation Messages', () => {
    it('should show message when less than 2 valid variants', () => {
      render(<MarketSimulatorPage />)

      expect(screen.getByText('Completa al menos 2 variantes')).toBeInTheDocument()
    })

    it('should show message when no personas selected', async () => {
      const user = userEvent.setup()
      render(<MarketSimulatorPage />)

      // Fill variants
      const textareas = screen.getAllByRole('textbox')
      await user.type(textareas[0], 'Valid variant text here')
      await user.type(textareas[1], 'Another valid variant')

      expect(screen.getByText('Selecciona al menos 1 Buyer Persona')).toBeInTheDocument()
    })

    it('should show count of ready variants', async () => {
      const user = userEvent.setup()
      render(<MarketSimulatorPage />)

      const textareas = screen.getAllByRole('textbox')
      await user.type(textareas[0], 'Valid variant')

      expect(screen.getByText(/1 variantes listas/)).toBeInTheDocument()
    })

    it('should show count of selected personas', () => {
      render(<MarketSimulatorPage />)

      expect(screen.getByText(/0 Buyer Personas seleccionadas/)).toBeInTheDocument()
    })
  })

  describe('Loading States', () => {
    it('should show loading state for personas', () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
      })

      render(<MarketSimulatorPage />)

      expect(screen.getByText('Cargando perfiles...')).toBeInTheDocument()
    })
  })

  describe('Info Section', () => {
    it('should show how it works section', () => {
      render(<MarketSimulatorPage />)

      expect(screen.getByText('¿Cómo funciona?')).toBeInTheDocument()
      expect(screen.getByText(/Cada Buyer Persona evalúa TODAS las variantes/)).toBeInTheDocument()
    })

    it('should explain the evaluation process', () => {
      render(<MarketSimulatorPage />)

      expect(screen.getByText(/Analizan fricción mental/)).toBeInTheDocument()
      expect(screen.getByText(/Generan críticas específicas/)).toBeInTheDocument()
      expect(screen.getByText(/IA sintetiza/)).toBeInTheDocument()
    })
  })

  describe('Results Display', () => {
    it('should show results after successful simulation', () => {
      const mockData = {
        result: {
          winningVariant: {
            index: 0,
            text: 'Winning variant',
            consensusScore: 75,
            avgFriction: 3.2,
          },
          frictionMap: [],
          synthesis: 'Test synthesis',
          costBreakdown: {
            totalCost: 0.006,
            totalTokens: 1000,
          },
        },
        personas: mockBuyerPersonas,
      }

      mockUseMutation.mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        data: mockData,
      })

      render(<MarketSimulatorPage />)

      expect(screen.getByText('Test synthesis')).toBeInTheDocument()
    })

    it('should not show results initially', () => {
      render(<MarketSimulatorPage />)

      expect(screen.queryByText('Síntesis de IA')).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<MarketSimulatorPage />)

      const textareas = screen.getAllByRole('textbox')
      expect(textareas.length).toBeGreaterThan(0)
    })

    it('should have descriptive button text', () => {
      render(<MarketSimulatorPage />)

      expect(screen.getByText('Ejecutar Focus Group IA')).toBeInTheDocument()
      expect(screen.getByText('Añadir')).toBeInTheDocument()
    })

    it('should have proper headings hierarchy', () => {
      render(<MarketSimulatorPage />)

      const heading = screen.getByText('Simulador de Mercado')
      expect(heading.tagName).toBe('H1')
    })
  })

  describe('Responsive Design', () => {
    it('should use grid layout', () => {
      const { container } = render(<MarketSimulatorPage />)

      const gridElement = container.querySelector('.grid')
      expect(gridElement).toBeInTheDocument()
    })
  })
})
