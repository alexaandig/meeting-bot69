import { OrganizationList } from '@clerk/nextjs'
import React from 'react'

const SelectOrgPage = () => {
    return (
        <div className="flex items-center justify-center h-screen">
            <OrganizationList
                hidePersonal={true}
                afterSelectOrganizationUrl="/home"
                afterCreateOrganizationUrl="/home"
            />
        </div>
    )
}

export default SelectOrgPage
