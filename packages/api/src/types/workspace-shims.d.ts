declare module '@quoorum/workers' {
  export const inngest: {
    send(payload: {
      name: string
      data?: Record<string, unknown>
    }): Promise<unknown>
  }

  export function sendTeamInvitationEmail(
    email: string,
    inviterName: string,
    invitationToken: string,
    role: string
  ): Promise<{
    success: boolean
    error?: string
  }>
}

declare module 'xlsx' {
  export function read(data: unknown, options?: unknown): {
    SheetNames: string[]
    Sheets: Record<string, unknown>
  }

  export const utils: {
    sheet_to_csv(sheet: unknown): string
    sheet_to_json(sheet: unknown): any[]
  }
}
