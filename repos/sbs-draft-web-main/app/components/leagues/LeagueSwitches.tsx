import { classNames } from "@/utils/helpers"
import { Switch } from "@headlessui/react"

export const LeagueSwitches = ({
    viewManageLeagues,
    setViewManageLeagues,
                               }: {
                                viewManageLeagues: any,
                                setViewManageLeagues: any
                               }) => {
    return (
        <div className="flex items-center justify-center">
            <div
                className={classNames(
                    viewManageLeagues ? "text-slate-500" : "dark:text-primary text-black",
                    "uppercase text-xs pb-1 pr-2 transition-all hover:cursor-pointer",
                )}
                onClick={() => {
                    // setViewManageLeagues(false)
                }}
            >
                Active Drafts
            </div>
            <div>
                <Switch
                    checked={viewManageLeagues}
                    onChange={setViewManageLeagues}
                    className={classNames(
                        viewManageLeagues ? "bg-green-600" : "bg-primary",
                        "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-slate-600 focus:ring-offset-2",
                    )}
                >
                    <span className="sr-only">Toggle Leagues</span>
                    <span
                        aria-hidden="true"
                        className={classNames(
                            viewManageLeagues ? "translate-x-5" : "translate-x-0",
                            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                        )}
                    />
                </Switch>
            </div>
            <div
                className={classNames(
                    !viewManageLeagues ? "text-slate-500" : "text-green-600",
                    "uppercase text-xs pb-1 pl-2 transition-all hover:cursor-pointer",
                )}
                onClick={() => setViewManageLeagues(true)}
            >
                Manage Leagues
            </div>
        </div>

    )
}