import type { Context } from '@netlify/functions'

export default async (req: Request, context: Context) => {
  const ip =
    context.ip ||
    req.headers.get('x-nf-client-connection-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    null

  const geo = context.geo
    ? {
        city: context.geo.city ?? null,
        country: context.geo.country?.name ?? null,
        countryCode: context.geo.country?.code ?? null,
        subdivision: context.geo.subdivision?.name ?? null,
        timezone: context.geo.timezone ?? null,
        latitude: context.geo.latitude ?? null,
        longitude: context.geo.longitude ?? null,
      }
    : null

  return Response.json(
    { ip, geo, userAgent: req.headers.get('user-agent') || null },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  )
}

export const config = {
  path: '/api/userinfo',
}
