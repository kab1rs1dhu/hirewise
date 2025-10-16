"use client"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import Link from "next/link";
import { z } from "zod"
import Image from "next/image"
import {Form} from "@/components/ui/form"
import FormField from "./FormField";

import { Button } from "@/components/ui/button"

import { toast } from "sonner";


const authFormSchema = (type: FormType) => {
  return z.object({
    name: type === "sign-up" ? z.string().min(3) : z.string().optional(),
    email: z.string().email(),
    password: z.string().min(3),
  })
}


const AuthForm = ({type }: {type: FormType}) => {

  const formSchema = authFormSchema(type);


  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "", 
    },
  })

  // 2. Define a submit handler.
  function onSubmit(values: z.infer<typeof formSchema>) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.

    try {

      if(type === "sign-in") {
        toast.success("Signed in successfully!")
      }
      else {
        toast.success("Account created successfully!")
      }
      
    } catch (error) {

      console.log(error)
      toast.error("Something went wrong. Please try again.")
      
    }

  }

  const isSignIn = type === "sign-in"

  return (
    <div className="card-border lg:min-w-w[566px]">
      <div className="flex flex-col gap-6 card py-14 px-10">
        <div className="flex flex-row gap-2 justify-center">
          <Image src="/logo.svg" alt="logo" height={32} width={38} />
          <h2 className="text-primary-100">Hire Wise</h2>

        </div>

        <h3>Get hired faster using AI</h3>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6 mt-4 form">

            {!isSignIn && (<FormField control={form.control} name="name" label="Name" placeholder="Your name" />)}
            <FormField control={form.control} name="email" label="Email" placeholder="Your email address" type="email" />
            <FormField control={form.control} name="password" label="Password" placeholder="Enter your password"  type="password" />


            <Button className = "btn" type="submit">{isSignIn ? "Sign In" : "Create an account now"}</Button>
          </form>
        </Form>

        <p className ="text-center">
          {isSignIn ? "Don't have an account? " : "Already have an account? "}
          <Link href={!isSignIn ? "/sign-in" : "/sign-up"} className = "font-bold text-user-primary ml-1"> 
          {!isSignIn ? "Sign In" : "Sign Up"}</Link>

        </p>

      </div>
    </div>
  )
}

export default AuthForm