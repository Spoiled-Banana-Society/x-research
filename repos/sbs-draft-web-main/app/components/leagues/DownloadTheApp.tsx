import Link from "next/link"

export const DownloadTheApp = () => {
    return (
        <div className="w-full md:w-[600px] mx-auto pb-10">
            <Link
                href="https://apps.apple.com/us/app/spoiled-banana-society/id6448928742"
                target="_blank"
            >
                <img
                    src="/app-banner.webp"
                    className="w-full h-auto"
                    alt="Download the Mobile App"
                />
            </Link>
        </div>
    )
}