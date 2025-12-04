import React from 'react'
import { Loader2 } from 'lucide-react'

function PageLoader() {
    return (
        <div className="flex items-center justify-center h-screen">
            <Loader2 className="size-10 animate-spin" />
        </div>
    )
}

export default PageLoader