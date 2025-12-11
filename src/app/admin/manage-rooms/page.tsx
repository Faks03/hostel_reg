"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Plus, Edit2, Trash2, Building, Bed, Users } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import api from "@/utils/api" 
import { AxiosError } from 'axios';

// Interface types
interface StudentInRoom {
  id: number;
  name: string;
  matricNumber: string;
}

interface Room {
  id: number;
  block: string;
  roomNumber: string;
  capacity: number;
  allocations: StudentInRoom[];
  status: 'available' | 'full' | 'maintenance' | 'unavailable';
  occupiedCapacity: number;
  availableCapacity: number;
}

interface Block {
  name: string;
  totalRooms: number;
  totalCapacity: number;
  occupiedCapacity: number;
  availableCapacity: number;
}

interface RoomFormData {
  block: string;
  roomNumber: string;
  capacity: number;
}

export default function ManageRooms() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [blocks, setBlocks] = useState<Block[]>([])
  const [selectedBlock, setSelectedBlock] = useState<string>('all')
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  // Form state with dedicated interface
  const [formData, setFormData] = useState<RoomFormData>({
    block: '',
    roomNumber: '',
    capacity: 4
  })

  useEffect(() => {
    fetchRoomsAndBlocks()
  }, [])

  const fetchRoomsAndBlocks = async () => {
    try {
      setLoading(true);
      
      const [roomsResponse, blocksResponse] = await Promise.all([
        api.get<Room[]>('/rooms'),
        api.get<Block[]>('/rooms/blocks')
      ]);

      const roomsData = roomsResponse.data;
      const blocksData = blocksResponse.data;

const roomsWithStats = roomsData.map((room: any) => ({
  ...room,
  status: room.status as "available" | "full" | "maintenance" | "unavailable",
  occupiedCapacity: room.allocations?.length || 0,
  availableCapacity: room.capacity - (room.allocations?.length || 0),
}));
      setRooms(roomsWithStats);
      setBlocks(blocksData);
      
    } catch (error) {
      if (error instanceof AxiosError) {
        console.error('Failed to fetch data:', error.response?.data || error.message);
        alert(`Failed to fetch data. ${error.response?.data?.error || "Please check your network."}`);
      } else {
        console.error('An unexpected error occurred:', error);
        alert("An unexpected error occurred.");
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDialogOpen = (room?: Room) => {
    if (room) {
      setSelectedRoom(room)
      setFormData({
        block: room.block,
        roomNumber: room.roomNumber,
        capacity: room.capacity,
      })
    } else {
      setSelectedRoom(null)
      setFormData({
        block: '',
        roomNumber: '',
        capacity: 4,
      })
    }
    setIsDialogOpen(true)
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    setSelectedRoom(null)
    setFormData({
      block: '',
      roomNumber: '',
      capacity: 4,
    })
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const action = selectedRoom ? updateRoom : addRoom;
    await action();
    handleDialogClose();
  }

  const addRoom = async () => {
    try {
      const response = await api.post<Room>('/rooms', formData);
      await fetchRoomsAndBlocks();
    } catch (error) {
      if (error instanceof AxiosError) {
        console.error('Failed to add room:', error.response?.data || error.message);
        alert(`Error: ${error.response?.data?.error || "Failed to add room."}`);
      }
    }
  }

  const updateRoom = async () => {
    if (!selectedRoom) return

    try {
      const response = await api.patch<Room>(`/rooms/${selectedRoom.id}`, formData);
      await fetchRoomsAndBlocks();
    } catch (error) {
      if (error instanceof AxiosError) {
        console.error('Failed to update room:', error.response?.data || error.message);
        alert(`Error: ${error.response?.data?.error || "Failed to update room."}`);
      }
    }
  }

  const deleteRoom = async (roomId: number) => {
    if (!confirm('Are you sure you want to delete this room? This cannot be undone.')) return

    try {
      await api.delete(`/rooms/${roomId}`);
      await fetchRoomsAndBlocks();
    } catch (error) {
      if (error instanceof AxiosError) {
        console.error('Failed to delete room:', error.response?.data || error.message);
        alert(`Error deleting room: ${error.response?.data?.error || "Failed to delete room."}`);
      }
    }
  }

  const filteredRooms = selectedBlock === 'all'
    ? rooms
    : rooms.filter(room => room.block === selectedBlock)

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'available': return 'default'
      case 'full': return 'secondary'
      case 'maintenance': return 'destructive'
      case 'unavailable': return 'outline'
      default: return 'default'
    }
  }
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'text-green-600'
      case 'full': return 'text-blue-600'
      case 'maintenance': return 'text-red-600'
      case 'unavailable': return 'text-gray-600'
      default: return 'text-gray-600'
    }
  }

  const totalCapacity = blocks.reduce((sum, block) => sum + block.totalCapacity, 0);
  const occupiedCapacity = blocks.reduce((sum, block) => sum + block.occupiedCapacity, 0);
  const availableCapacity = totalCapacity - occupiedCapacity;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Manage Rooms</h2>
          <p className="text-muted-foreground">
            Manage hostel rooms and occupancy
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleDialogOpen()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Room
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedRoom ? 'Edit Room' : 'Add New Room'}</DialogTitle>
              <DialogDescription>
                {selectedRoom ? 'Edit an existing room.' : 'Create a new room in the hostel system.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="block">Block Name</Label>
                <Select
                  value={formData.block}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, block: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select block" />
                  </SelectTrigger>
                  <SelectContent>
                    {blocks.map(block => (
                      <SelectItem key={block.name} value={block.name}>Block {block.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="roomNumber">Room Number</Label>
                <Input
                  id="roomNumber"
                  value={formData.roomNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, roomNumber: e.target.value }))}
                  placeholder="e.g., 1"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Select
                  value={formData.capacity.toString()}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, capacity: parseInt(value) }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 Students</SelectItem>
                    <SelectItem value="3">3 Students</SelectItem>
                    <SelectItem value="4">4 Students</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button onClick={handleDialogClose} variant="outline" type="button">
                  Cancel
                </Button>
                <Button type="submit">
                  {selectedRoom ? 'Save Changes' : 'Add Room'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="rooms">Room Management</TabsTrigger>
          <TabsTrigger value="blocks">Block View</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Rooms</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{rooms.length}</div>
                <p className="text-xs text-muted-foreground">
                  Across all blocks
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Capacity</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalCapacity}</div>
                <p className="text-xs text-muted-foreground">
                  Total student capacity
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Occupied Capacity</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{occupiedCapacity}</div>
                <p className="text-xs text-muted-foreground">
                  Currently occupied
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Available Capacity</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{availableCapacity}</div>
                <p className="text-xs text-muted-foreground">
                  Spaces available
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Block Summary</CardTitle>
              <CardDescription>Overview of each hostel block</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {blocks.map((block) => (
                  <div key={block.name} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">Block {block.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {block.totalRooms} rooms • {block.totalCapacity} capacity
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {block.occupiedCapacity}/{block.totalCapacity} occupied
                      </div>
                      <div className="w-24 mt-2 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${(block.occupiedCapacity / block.totalCapacity) * 100}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rooms" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Room List</CardTitle>
                <Select value={selectedBlock} onValueChange={setSelectedBlock}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by Block" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Blocks</SelectItem>
                    {blocks.map(block => (
                      <SelectItem key={block.name} value={block.name}>Block {block.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Room</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Occupied</TableHead>
                    <TableHead>Available</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRooms.map((room) => (
                    <TableRow key={room.id}>
                      <TableCell className="font-medium">Block {room.block} - {room.roomNumber}</TableCell>
                      <TableCell>{room.capacity}</TableCell>
                      <TableCell>{room.occupiedCapacity}</TableCell>
                      <TableCell>{room.availableCapacity}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(room.status)} className="capitalize">
                          {room.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleDialogOpen(room)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteRoom(room.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="blocks" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {blocks.map(block => (
              <Card key={block.name}>
                <CardHeader>
                  <CardTitle>Block {block.name}</CardTitle>
                  <CardDescription>
                    {block.totalRooms} rooms | {block.occupiedCapacity}/{block.totalCapacity} capacity
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {rooms.filter(room => room.block === block.name).map(room => (
                      <div key={room.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-2">
                          <Bed className={`h-4 w-4 ${getStatusColor(room.status)}`} />
                          <span className="font-medium">Room {room.roomNumber}</span>
                        </div>
                        <Badge variant={getStatusBadgeVariant(room.status)}>
                          {room.occupiedCapacity}/{room.capacity}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
