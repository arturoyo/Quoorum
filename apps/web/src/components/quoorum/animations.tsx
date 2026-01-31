/**
 * Quoorum Animations & Transitions
 * 
 * WOW-factor animations for Quoorum UI
 */

'use client'

import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { type ReactNode } from 'react'

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
}

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
}

export const slideDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  exit: { opacity: 0, y: 20, transition: { duration: 0.2 } },
}

export const slideLeft: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.2 } },
}

export const slideRight: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  exit: { opacity: 0, x: 20, transition: { duration: 0.2 } },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } },
}

export const scaleUp: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] } },
  exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } },
}

export const bounceIn: Variants = {
  hidden: { opacity: 0, scale: 0.3 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 15,
    },
  },
  exit: { opacity: 0, scale: 0.3, transition: { duration: 0.2 } },
}

export const rotateIn: Variants = {
  hidden: { opacity: 0, rotate: -10, scale: 0.9 },
  visible: {
    opacity: 1,
    rotate: 0,
    scale: 1,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
  exit: { opacity: 0, rotate: 10, scale: 0.9, transition: { duration: 0.2 } },
}

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
}

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

// ============================================================================
// ANIMATED COMPONENTS
// ============================================================================

export function FadeIn({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={fadeIn}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  )
}

export function SlideUp({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={slideUp}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  )
}

export function ScaleIn({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={scaleIn}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  )
}

export function BounceIn({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={bounceIn}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  )
}

export function StaggerList({ children }: { children: ReactNode }) {
  return (
    <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children }: { children: ReactNode }) {
  return <motion.div variants={staggerItem}>{children}</motion.div>
}

// ============================================================================
// SPECIAL EFFECTS
// ============================================================================

export function PulseEffect({ children }: { children: ReactNode }) {
  return (
    <motion.div
      animate={{
        scale: [1, 1.05, 1],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {children}
    </motion.div>
  )
}

export function ShakeEffect({ children, trigger }: { children: ReactNode; trigger: boolean }) {
  return (
    <motion.div
      animate={
        trigger
          ? {
              x: [0, -10, 10, -10, 10, 0],
            }
          : {}
      }
      transition={{ duration: 0.5 }}
    >
      {children}
    </motion.div>
  )
}

export function GlowEffect({ children, active }: { children: ReactNode; active: boolean }) {
  return (
    <motion.div
      animate={{
        boxShadow: active
          ? [
              '0 0 0px rgba(0, 168, 132, 0)',
              '0 0 20px rgba(0, 168, 132, 0.5)',
              '0 0 0px rgba(0, 168, 132, 0)',
            ]
          : '0 0 0px rgba(0, 168, 132, 0)',
      }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      {children}
    </motion.div>
  )
}

export function FloatEffect({ children }: { children: ReactNode }) {
  return (
    <motion.div
      animate={{
        y: [0, -10, 0],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {children}
    </motion.div>
  )
}

export function TypewriterEffect({ text }: { text: string }) {
  const letters = text.split('')

  return (
    <motion.span>
      {letters.map((letter, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.05, delay: i * 0.05 }}
        >
          {letter}
        </motion.span>
      ))}
    </motion.span>
  )
}

// ============================================================================
// PAGE TRANSITIONS
// ============================================================================

export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

export function ModalTransition({ children, isOpen }: { children: ReactNode; isOpen: boolean }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ============================================================================
// LOADING ANIMATIONS
// ============================================================================

export function SpinnerAnimation() {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full"
    />
  )
}

export function DotsAnimation() {
  return (
    <div className="flex gap-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={{
            y: [0, -10, 0],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.2,
          }}
          className="w-2 h-2 bg-primary rounded-full"
        />
      ))}
    </div>
  )
}

export function ProgressAnimation({ progress }: { progress: number }) {
  return (
    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="h-full bg-primary"
      />
    </div>
  )
}

// ============================================================================
// GESTURE ANIMATIONS
// ============================================================================

export function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
}: {
  children: ReactNode
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
}) {
  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDragEnd={(_, info) => {
        if (info.offset.x > 100 && onSwipeRight) {
          onSwipeRight()
        } else if (info.offset.x < -100 && onSwipeLeft) {
          onSwipeLeft()
        }
      }}
      whileDrag={{ scale: 1.05 }}
    >
      {children}
    </motion.div>
  )
}

export function HoverScaleCard({ children }: { children: ReactNode }) {
  return (
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }}>
      {children}
    </motion.div>
  )
}

export function PressableButton({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      onClick={onClick}
    >
      {children}
    </motion.button>
  )
}

// ============================================================================
// NOTIFICATION ANIMATIONS
// ============================================================================

export function ToastNotification({
  children,
  isVisible,
}: {
  children: ReactNode
  isVisible: boolean
}) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.3 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
          className="fixed top-4 right-4 z-50"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function SuccessCheckmark() {
  return (
    <motion.svg
      width="60"
      height="60"
      viewBox="0 0 60 60"
      initial="hidden"
      animate="visible"
    >
      <motion.circle
        cx="30"
        cy="30"
        r="28"
        stroke="#00a884"
        strokeWidth="2"
        fill="none"
        variants={{
          hidden: { pathLength: 0 },
          visible: { pathLength: 1, transition: { duration: 0.5 } },
        }}
      />
      <motion.path
        d="M15 30 L25 40 L45 20"
        stroke="#00a884"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        variants={{
          hidden: { pathLength: 0 },
          visible: { pathLength: 1, transition: { duration: 0.5, delay: 0.3 } },
        }}
      />
    </motion.svg>
  )
}
