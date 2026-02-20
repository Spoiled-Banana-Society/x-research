"use client"
import styled from "styled-components"


const PromotionsComponent = () => {
    return (
        <>
            <main className="flex flex-col">
                <div className="pt-16 text-center px-3 font-primary" style={{marginBottom: '20px'}}>
                    <h1 className="text-[38px] font-bold font-primary italic uppercase">
                        Promotions
                    </h1>
                </div>
                <div className="items-center justify-center" style={{margin: '0% 10%'}}>
                    <p className="font-primary text-[26px] italic uppercase text-white dark:text-white">
                        Draft Pass Promotions
                    </p>
                    <div className="pb-10"></div>
                    <p className="font-primary text-[18px] italic text-white dark:text-white">
                        <b>Returning Users</b>
                    </p>
                    <p className="font-primary text-[18px] italic text-white dark:text-white">
                        For every 10 Draft Passes you buy:
                    </p>
                    <ul>
                        <li>- Chance at winning $500 in Free Drafts by spinning the Banana Wheel.</li>
                        <li>- Guaranteed at least 1 Free Draft.</li>
                        <li>- Ends June 11th 11:59 PST</li>

                    </ul>
                    <div className="pb-10"></div>
                    <p className="font-primary text-[18px] italic text-white dark:text-white">
                        <b>New Users:</b>
                    </p>
                    <p className="font-primary text-[18px] italic text-white dark:text-white">
                        Get a 50% deposit bonus on your first purchase up to 10 Drafts.
                    </p>
                    <ul>
                        <li>- Buy 20 get 10 Free.</li>
                        <li>- Buy 10 get 5 Free.</li>
                        <li>- Each 10 you buy you have a chance at winning $500 dollars in Free Drafts by spinning the Banana Wheel.</li>
                    </ul>
                    <div className="pb-10"></div>
                    <p className="font-primary text-[26px] italic uppercase text-white dark:text-white">
                        Draft Promotions
                    </p>
                    <div className="pb-10"></div>
                    <ul>
                        <li>1. Do 4 Drafts in a day to spin the Banana Wheel.</li>
                        <li>2. Do 3 Drafts in a day and get a Free Draft.</li>
                        <li>3. Anytime the Founders are in your Draft everyone will get to spin the Banana Wheel.</li>
                    </ul>
                    <div className="pb-10"></div>
                    <p className="font-primary text-[26px] italic uppercase text-white dark:text-white">
                        Social Media Promotions
                    </p>
                    <div className="pb-10"></div>
                    <p className="font-primary text-[18px] italic uppercase text-white dark:text-white">
                        Engage of X to win daily prizes
                    </p>
                    <div className="pb-10"></div>
                    <ul>
                        <li>1. For every action (tweet, comment, like etc.) you will receive points on the leaderboard. The more points you get the greater chance that you have to be a daily winner.</li>
                        <li>2. One person daily will be randomly selected to spin the Banana Wheel.</li>
                        <li>3. Each day, one of the top 5 point scorers will be randomly selected to spin the Banana Wheel.</li>
                    </ul>
                    <div className="pb-10"></div>
                    <p className="font-primary text-[18px] italic uppercase text-white dark:text-white">
                        Check the social media promotions channel in our <a style={{color: 'yellow'}} href="https://discord.gg/JQ9K4VTe9B">Discord</a> for details.
                    </p>
                    
                    <div className="pb-10"></div>
                    <img src="/banana-wheel.png" alt="Banana Best Ball" className="rounded mx-auto w-[600px] py-2" />
                    <div className="pb-10"></div>
                </div>
            </main>
        </>
    )
}

export default PromotionsComponent
