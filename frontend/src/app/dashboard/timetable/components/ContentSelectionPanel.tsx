// frontend/src/app/dashboard/timetable/components/ContentSelectionPanel.tsx
"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  BookOpen, 
  Search, 
  Filter,
  ChevronDown,
  ChevronRight,
  Clock,
  Target,
  CheckCircle2,
  Circle,
  Plus,
  Minus,
  Eye,
  EyeOff,
  RotateCcw,
  Loader2,
  AlertCircle,
  BookMarked,
  GraduationCap,
  Layers
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Topic {
  id: number
  title: string
  description: string
  duration_weeks: number
  is_active: boolean
  subject_id: number
}

interface Subtopic {
  id: number
  title: string
  content: string
  duration_lessons: number
  topic_id: number
  is_active: boolean
  display_order: number
}

interface Subject {
  id: number
  name: string
  code: string
  color: string
  is_active: boolean
}

interface ContentSelectionPanelProps {
  subjects: Subject[]
  currentSubject: Subject | null
  availableTopics: Topic[]
  availableSubtopics: Subtopic[]
  selectedTopicIds: number[]
  selectedSubtopicIds: number[]
  loading: boolean
  error: string | null
  onSubjectChange: (subjectId: string) => void
  onTopicSelect: (topicId: number, checked: boolean) => void
  onSubtopicSelect: (subtopicId: number, checked: boolean) => void
  onBulkTopicSelect: (topicIds: number[], selected: boolean) => void
  onBulkSubtopicSelect: (subtopicIds: number[], selected: boolean) => void
}

const ContentSelectionPanel = ({
  subjects,
  currentSubject,
  availableTopics,
  availableSubtopics,
  selectedTopicIds,
  selectedSubtopicIds,
  loading,
  error,
  onSubjectChange,
  onTopicSelect,
  onSubtopicSelect,
  onBulkTopicSelect,
  onBulkSubtopicSelect
}: ContentSelectionPanelProps) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterBy, setFilterBy] = useState<'all' | 'active' | 'inactive'>('all')
  const [expandedTopics, setExpandedTopics] = useState<Set<number>>(new Set())
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'compact'>('list')
  const [showOnlySelected, setShowOnlySelected] = useState(false)

  // Filter topics based on search and filters
  const filteredTopics = availableTopics.filter(topic => {
    const matchesSearch = topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         topic.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterBy === 'all' || 
                         (filterBy === 'active' && topic.is_active) ||
                         (filterBy === 'inactive' && !topic.is_active)
    const matchesSelected = !showOnlySelected || selectedTopicIds.includes(topic.id)
    
    return matchesSearch && matchesFilter && matchesSelected
  })

  // Get subtopics for filtered topics
  const getSubtopicsForTopic = (topicId: number) => {
    return availableSubtopics
      .filter(subtopic => subtopic.topic_id === topicId)
      .sort((a, b) => a.display_order - b.display_order)
  }

  const filteredSubtopics = availableSubtopics.filter(subtopic => {
    const matchesSearch = subtopic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         subtopic.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterBy === 'all' || 
                         (filterBy === 'active' && subtopic.is_active) ||
                         (filterBy === 'inactive' && !subtopic.is_active)
    const matchesSelected = !showOnlySelected || selectedSubtopicIds.includes(subtopic.id)
    
    return matchesSearch && matchesFilter && matchesSelected
  })

  const toggleTopicExpansion = (topicId: number) => {
    setExpandedTopics(prev => {
      const newSet = new Set(prev)
      if (newSet.has(topicId)) {
        newSet.delete(topicId)
      } else {
        newSet.add(topicId)
      }
      return newSet
    })
  }

  const handleSelectAllTopics = () => {
    const allTopicIds = filteredTopics.map(t => t.id)
    const allSelected = allTopicIds.every(id => selectedTopicIds.includes(id))
    onBulkTopicSelect(allTopicIds, !allSelected)
  }

  const handleSelectAllSubtopics = () => {
    const allSubtopicIds = filteredSubtopics.map(s => s.id)
    const allSelected = allSubtopicIds.every(id => selectedSubtopicIds.includes(id))
    onBulkSubtopicSelect(allSubtopicIds, !allSelected)
  }

  const getTotalDuration = () => {
    const topicDuration = availableTopics
      .filter(topic => selectedTopicIds.includes(topic.id))
      .reduce((sum, topic) => sum + topic.duration_weeks, 0)
    
    const subtopicDuration = availableSubtopics
      .filter(subtopic => selectedSubtopicIds.includes(subtopic.id))
      .reduce((sum, subtopic) => sum + subtopic.duration_lessons, 0)
    
    return { weeks: topicDuration, lessons: subtopicDuration }
  }

  const duration = getTotalDuration()

  const TopicCard = ({ topic }: { topic: Topic }) => {
    const isSelected = selectedTopicIds.includes(topic.id)
    const isExpanded = expandedTopics.has(topic.id)
    const subtopics = getSubtopicsForTopic(topic.id)
    const selectedSubtopicsCount = subtopics.filter(s => selectedSubtopicIds.includes(s.id)).length

    return (
      <div className={cn(
        "border rounded-lg p-4 transition-all duration-200",
        isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300",
        !topic.is_active && "opacity-75"
      )}>
        <div className="flex items-start space-x-3">
          <Checkbox
            id={`topic-${topic.id}`}
            checked={isSelected}
            onCheckedChange={(checked) => onTopicSelect(topic.id, checked as boolean)}
            className="mt-1"
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <label 
                htmlFor={`topic-${topic.id}`}
                className="text-sm font-medium text-gray-900 cursor-pointer flex items-center gap-2"
              >
                <BookMarked className="h-4 w-4 text-blue-600" />
                {topic.title}
                {subtopics.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleTopicExpansion(topic.id)}
                    className="h-6 w-6 p-0"
                  >
                    {isExpanded ? 
                      <ChevronDown className="h-3 w-3" /> : 
                      <ChevronRight className="h-3 w-3" />
                    }
                  </Button>
                )}
              </label>
              
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {topic.duration_weeks}w
                </Badge>
                <Badge 
                  variant={topic.is_active ? "default" : "secondary"} 
                  className="text-xs"
                >
                  {topic.is_active ? "Active" : "Inactive"}
                </Badge>
                {subtopics.length > 0 && (
                  <Badge variant="outline" className="text-xs bg-purple-50">
                    {selectedSubtopicsCount}/{subtopics.length} subtopics
                  </Badge>
                )}
              </div>
            </div>
            
            {topic.description && (
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                {topic.description}
              </p>
            )}
            
            {/* Subtopics */}
            {isExpanded && subtopics.length > 0 && (
              <div className="mt-3 pl-4 border-l-2 border-gray-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-700">Subtopics</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const allSelected = subtopics.every(s => selectedSubtopicIds.includes(s.id))
                      subtopics.forEach(s => onSubtopicSelect(s.id, !allSelected))
                    }}
                    className="h-6 text-xs"
                  >
                    {subtopics.every(s => selectedSubtopicIds.includes(s.id)) ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
                
                {subtopics.map((subtopic) => (
                  <SubtopicItem 
                    key={subtopic.id} 
                    subtopic={subtopic} 
                    isSelected={selectedSubtopicIds.includes(subtopic.id)}
                    onSelect={onSubtopicSelect}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const SubtopicItem = ({ 
    subtopic, 
    isSelected, 
    onSelect 
  }: { 
    subtopic: Subtopic
    isSelected: boolean
    onSelect: (id: number, checked: boolean) => void
  }) => (
    <div className={cn(
      "flex items-start space-x-3 p-2 rounded border",
      isSelected ? "border-green-500 bg-green-50" : "border-gray-100 hover:border-gray-200",
      !subtopic.is_active && "opacity-75"
    )}>
      <Checkbox
        id={`subtopic-${subtopic.id}`}
        checked={isSelected}
        onCheckedChange={(checked) => onSelect(subtopic.id, checked as boolean)}
        className="mt-0.5"
      />
      
      <div className="flex-1 min-w-0">
        <label 
          htmlFor={`subtopic-${subtopic.id}`}
          className="text-sm font-medium text-gray-900 cursor-pointer flex items-center gap-2"
        >
          <Layers className="h-3 w-3 text-green-600" />
          {subtopic.title}
        </label>
        
        {subtopic.content && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-1">
            {subtopic.content}
          </p>
        )}
        
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="outline" className="text-xs">
            {subtopic.duration_lessons} lessons
          </Badge>
          <Badge 
            variant={subtopic.is_active ? "default" : "secondary"} 
            className="text-xs"
          >
            {subtopic.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>
      </div>
    </div>
  )

  if (error) {
    return (
      <Card className="shadow-lg border-0 bg-white">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">Error loading content</span>
          </div>
          <p className="text-sm text-gray-600 mt-2">{error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-lg border-0 bg-white">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-purple-600" />
          Subject & Content Selection
        </CardTitle>
        <CardDescription>
          Choose your subject and select the topics/subtopics to include in your timetable
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        
        {/* Subject Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Subject
          </label>
          <Select 
            value={currentSubject?.id?.toString() || ''} 
            onValueChange={onSubjectChange}
            disabled={loading}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={loading ? "Loading subjects..." : "Select a subject"} />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((subject) => (
                <SelectItem key={subject.id} value={subject.id.toString()}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded" 
                      style={{ backgroundColor: subject.color || '#6B7280' }}
                    />
                    {subject.name} ({subject.code})
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {currentSubject && (
          <>
            {/* Search and Filters */}
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search topics and subtopics..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={filterBy} onValueChange={(value: any) => setFilterBy(value)}>
                  <SelectTrigger className="w-32">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="show-selected"
                      checked={showOnlySelected}
                      onCheckedChange={setShowOnlySelected}
                    />
                    <label htmlFor="show-selected" className="text-sm text-gray-600">
                      Show only selected
                    </label>
                  </div>
                  
                  {loading && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading...
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchTerm('')
                      setFilterBy('all')
                      setShowOnlySelected(false)
                    }}
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Reset
                  </Button>
                </div>
              </div>
            </div>

            {/* Content Tabs */}
            <Tabs defaultValue="topics" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="topics" className="flex items-center gap-2">
                  <BookMarked className="h-4 w-4" />
                  Topics ({filteredTopics.length})
                </TabsTrigger>
                <TabsTrigger value="subtopics" className="flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  Subtopics ({filteredSubtopics.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="topics" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAllTopics}
                      disabled={filteredTopics.length === 0}
                    >
                      {filteredTopics.every(t => selectedTopicIds.includes(t.id)) ? 
                        <Minus className="h-4 w-4 mr-1" /> : 
                        <Plus className="h-4 w-4 mr-1" />
                      }
                      {filteredTopics.every(t => selectedTopicIds.includes(t.id)) ? 
                        'Deselect All' : 'Select All'
                      }
                    </Button>
                    <span className="text-sm text-gray-500">
                      {selectedTopicIds.length} of {availableTopics.length} selected
                    </span>
                  </div>
                </div>
                
                <ScrollArea className="h-80">
                  <div className="space-y-3">
                    {filteredTopics.length > 0 ? (
                      filteredTopics.map((topic) => (
                        <TopicCard key={topic.id} topic={topic} />
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <BookMarked className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No topics found</p>
                        <p className="text-sm">Try adjusting your search or filters</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="subtopics" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAllSubtopics}
                      disabled={filteredSubtopics.length === 0}
                    >
                      {filteredSubtopics.every(s => selectedSubtopicIds.includes(s.id)) ? 
                        <Minus className="h-4 w-4 mr-1" /> : 
                        <Plus className="h-4 w-4 mr-1" />
                      }
                      {filteredSubtopics.every(s => selectedSubtopicIds.includes(s.id)) ? 
                        'Deselect All' : 'Select All'
                      }
                    </Button>
                    <span className="text-sm text-gray-500">
                      {selectedSubtopicIds.length} of {availableSubtopics.length} selected
                    </span>
                  </div>
                </div>
                
                <ScrollArea className="h-80">
                  <div className="space-y-2">
                    {filteredSubtopics.length > 0 ? (
                      filteredSubtopics.map((subtopic) => (
                        <SubtopicItem 
                          key={subtopic.id} 
                          subtopic={subtopic} 
                          isSelected={selectedSubtopicIds.includes(subtopic.id)}
                          onSelect={onSubtopicSelect}
                        />
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No subtopics found</p>
                        <p className="text-sm">Select topics first or adjust your filters</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>

            {/* Selection Summary */}
            {(selectedTopicIds.length > 0 || selectedSubtopicIds.length > 0) && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="text-sm font-medium text-blue-900 mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Selection Summary
                </h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-lg font-bold text-blue-600">{selectedTopicIds.length}</p>
                    <p className="text-xs text-blue-700">Topics</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-blue-600">{selectedSubtopicIds.length}</p>
                    <p className="text-xs text-blue-700">Subtopics</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-blue-600">
                      {duration.weeks}w / {duration.lessons}l
                    </p>
                    <p className="text-xs text-blue-700">Duration</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default ContentSelectionPanel