
export const LeagueTable = ({children, viewManageLeagues}: {children: any, viewManageLeagues: any})=> {
    return (
        <div>
            <div
                className="w-max-full overflow-x-auto md:w-[640px] lg:w-[960px] px-4 sm:px-6 lg:px-8">
                <div className="mt-8 flow-root">
                    <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                        <div
                            className="inline-block sm:min-w-full py-2 align-middle sm:px-6 lg:px-8">
                            <table className="min-w-full divide-y divide-gray-300">
                                <thead>
                                <tr>
                                    <th
                                        scope="col"
                                        className="py-3 pl-4 pr-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 sm:pl-0"
                                    >
                                        League Name
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-3 sm:px-0 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500"
                                    >
                                        {viewManageLeagues ? "League Rank" : "Players"}
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-3 sm:px-0 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500"
                                    >
                                        {viewManageLeagues ? "Weekly Rank" : ""}
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-3 sm:px-0 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500"
                                    >
                                        {viewManageLeagues ? "Weekly Score" : ""}
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-3 sm:px-0 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500"
                                    >
                                        {viewManageLeagues ? "Season Score" : ""}
                                    </th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                {children}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}