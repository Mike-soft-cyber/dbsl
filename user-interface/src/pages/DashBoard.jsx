import React from "react";
import {User, Clock, BookOpen, Shield, Download, BookText, Medal, MoveRight, Plus, TrendingUpDown, LogIn} from 'lucide-react';
import { Button } from "@/components/ui/button";
import Navbar from "@/components/ui/dashboard/NavBar";
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardFooter, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RecentDocuments from "./RecentDocuments";

export default function DashBoard() {
      const navigate = useNavigate()
      const userData = JSON.parse(localStorage.getItem('userData'))
    
return(
    <div>
        <Navbar userData={userData} />
    <section className="flex flex-column justify-between items-center bg-pink-100 py-10">
        <h1 className="font-bold text-3xl">Welcome, {userData?.firstName + " " + userData?.lastName}!</h1>
        <Button onClick={() => navigate('/createDocument')} className="bg-teal-600 text-white p-6 hover:bg-teal-800 cursor-pointer"><Plus />Create Document</Button>
    </section>
    <section className="flex flex-column justify-start gap-10 bg-pink-100 py-30 items-center">
        <Card className="bg-teal-900 text-white shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-column justify-between text-10xs">
                <CardTitle>Documents Created</CardTitle>
                <BookText />
            </CardHeader>
            <CardContent>
                <p>{userData?.documentsCreated}</p>
            </CardContent>
            <CardFooter>
                <p>Total Documents Generated</p>
            </CardFooter>
        </Card>
        <Card className="text-teal-900">
            <CardHeader className="flex flex-column justify-between font-xxs text-10xs">
                <CardTitle>Downloads</CardTitle>
                <Download />
            </CardHeader>
            <CardContent>
                <p className="font-bold text-10xl">{userData?.downloads.length}</p>
            </CardContent>
            <CardFooter>
                <p>Documents downloaded</p>
            </CardFooter>
        </Card>
    </section>
    <section className='bg-teal-900 text-white p-6'>
                <h2 className='text-4xl font-bold text-center mb-4'>Quick Actions</h2>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-4'>
                 <Link to="/createDocument" state={{ type: 'Lesson Plan' }}>
        <Card className='bg-pink-100 text-teal-900 shadow-lg hover:shadow-xl hover:-translate-y-1 hover:bg-pink-200 transition-all duration-300 ease-in-out'>
          <CardHeader>
            <CardTitle>
              <BookOpen className="inline-block mr-2" size={48} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <h4 className='text-lg font-semibold'>Lesson Plans</h4>
          </CardContent>
          <CardFooter>
            <p>Detailed, structured lesson plans</p>
          </CardFooter>
        </Card>
      </Link>

      <Link to="/createDocument" state={{ type: 'Schemes of Work' }}>
        <Card className='bg-pink-100 text-teal-900 shadow-lg hover:shadow-xl hover:-translate-y-1 hover:bg-pink-200 transition-all duration-300 ease-in-out cursor-pointer'>
          <CardHeader>
            <CardTitle>
              <User className="inline-block mr-2" size={48} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <h4 className='text-lg font-semibold'>Schemes of Work</h4>
          </CardContent>
          <CardFooter>
            <p>Comprehensive term planning</p>
          </CardFooter>
        </Card>
      </Link>

      <Link to="/createDocument" state={{ type: 'Lesson Notes' }}>
        <Card className='bg-pink-100 text-teal-900 shadow-lg hover:shadow-xl hover:-translate-y-1 hover:bg-pink-200 transition-all duration-300 ease-in-out cursor-pointer'>
          <CardHeader>
            <CardTitle>
              <BookText className="inline-block mr-2" size={48} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <h4 className='text-lg font-semibold'>Lesson Notes</h4>
          </CardContent>
          <CardFooter>
            <p>Organized teaching notes</p>
          </CardFooter>
        </Card>
      </Link>

      <Link to="/createDocument" state={{ type: 'Exercises' }}>
        <Card className='bg-pink-100 text-teal-900 shadow-lg hover:shadow-xl hover:-translate-y-1 hover:bg-pink-200 transition-all duration-300 ease-in-out cursor-pointer'>
          <CardHeader>
            <CardTitle>
              <Medal className="inline-block mr-2" size={48} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <h4 className='text-lg font-semibold'>Exercises</h4>
          </CardContent>
          <CardFooter>
            <p>Practice and assessments</p>
          </CardFooter>
        </Card>
      </Link>
                </div>
    </section>
    <section>
        <div>
            <Card className="bg-teal-900 text-white">
                <RecentDocuments userId={userData?._id} />
            </Card>
        </div>
    </section>
</div>
)}
