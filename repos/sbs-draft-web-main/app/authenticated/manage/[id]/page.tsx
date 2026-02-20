"use client"
import ManageComponent from "@/app/components/ManageComponent"
import React from "react"

const Draft = ({ params }: { params: { id: string } }) => {
    const { id } = params
    return (
        <div>
            <ManageComponent leagueId={id} />
        </div>
    )
}

export default Draft
