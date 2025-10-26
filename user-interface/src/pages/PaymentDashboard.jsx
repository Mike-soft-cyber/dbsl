import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Toaster } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import API from "@/api";
import { Label } from "@/components/ui/label";

export default function PaymentDashboard() {
  const [payments, setPayments] = useState([]);
  const [search, setSearch] = useState("");

  const [grade, setGrade] = useState("");
  const [status, setStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchPayments = () => {
    const params = new URLSearchParams();
    if (grade) params.append("grade", grade);
    if (status) params.append("status", status);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    fetch(`/api/payments?${params.toString()}`)
      .then(res => res.json())
      .then(data => setPayments(data))
      .catch(err => console.error("Error fetching payments:", err));
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const filtered = payments.filter(p =>
    p.teacherName?.toLowerCase().includes(search.toLowerCase()) ||
    p.phone?.includes(search)
  );

  return (
    <div className="p-6">
      <Card className="p-4">
        <CardHeader>
          <CardTitle>💳 Payment Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Search by teacher name or phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Teacher Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(payment => (
                <TableRow key={payment.id}>
                  <TableCell>{payment.teacherName}</TableCell>
                  <TableCell>{payment.phone}</TableCell>
                  <TableCell>{payment.amount}</TableCell>
                  <TableCell>
                    <Badge variant={payment.status === 'Paid' ? 'success' : 'warning'}>
                      {payment.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
