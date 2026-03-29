import { getSystemConfig } from '@/services/config'
import RtpClient from './RtpClient'

export const dynamic = 'force-dynamic'

export default async function AdminRtpPage() {
    const config = await getSystemConfig()

    return (
        <RtpClient initialConfig={config} />
    )
}
