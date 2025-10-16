import { Button } from '@/components/ui/button'
import React from 'react'
import Image from 'next/image'

const page = () => {
  return (
    <>

      <section className="card-cta">

        <div className="flex flex-col gap-6 max-w-lg">
          <h2> Let AI get you a job</h2>
          <p className="text-lg">
            Practice on real interview questions, get AI-generated feedback, and land your dream job faster with Hire Wise.
          </p>
          <Button asChild className="btn-primary max-sw:w-full"></Button>
        </div>
        <Image src="/robot.png" alt="robot" height={400} width={400} className="max-sm:hidden" />

      </section>

      <section className="flex flex-col gap-6 mt-8">

        <h2> Your Interviews</h2>

        <div className="interviews-section">
          <p> You have not taken any interviews yet</p>

        </div>
      </section>

      <section className="flex flex-col gap-6 mt-8">

        <h2> Take an interview now! </h2>

        <div className="interviews-section">
          <p> There are no interviews available</p>
        </div>
      </section>

    </>
  )
}

export default page