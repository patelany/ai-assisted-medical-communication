import {NextRequest, NextResponse} from "next/server";

export async function POST(request: NextRequest){
    try{
        const body = await request.json();
        const {username, password} = body;

        const validUsername = process.env.RESEARCHER_USERNAME; 
        const validPassword = process.env.RESEARCHER_PASSWORD;

        if(!validUsername || !validPassword){
            return NextResponse.json(
                {error: "Server credentials not configured"},
                {status: 500}
            );
        }

        if(username === validUsername && password === validPassword){
            return NextResponse.json({success: true});
        }

        return NextResponse.json(
            {error: "Invalid credentials"},
            {status: 401}
        );
    } catch (error){
        return NextResponse.json(
            {error: "Auth failed"},
            {status: 500}
        );
    }
}