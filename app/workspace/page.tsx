import { OrganizationProfile } from '@clerk/nextjs'
import React from 'react'

const WorkspacePage = () => {
    return (
        <div className="flex items-center justify-center h-screen">
            <OrganizationProfile />
        </div>
    )
}

export default WorkspacePage
