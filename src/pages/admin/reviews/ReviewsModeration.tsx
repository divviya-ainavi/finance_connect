import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Flag, Search, Star, CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';

interface Review {
  id: string;
  title: string | null;
  content: string;
  rating: number;
  reviewer_type: string;
  is_hidden: boolean;
  is_flagged: boolean;
  flagged_reason: string | null;
  created_at: string;
}

export default function ReviewsModeration() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'flagged' | 'hidden'>('all');
  const [reviewerTypeFilter, setReviewerTypeFilter] = useState<'all' | 'worker' | 'business'>('all');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [flagReason, setFlagReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchReviews();
  }, [statusFilter, reviewerTypeFilter, ratingFilter, dateFrom, dateTo]);

  const fetchReviews = async () => {
    let query = supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });

    // Status filter
    if (statusFilter === 'flagged') {
      query = query.eq('is_flagged', true);
    } else if (statusFilter === 'hidden') {
      query = query.eq('is_hidden', true);
    }

    // Reviewer type filter
    if (reviewerTypeFilter !== 'all') {
      query = query.eq('reviewer_type', reviewerTypeFilter);
    }

    // Rating filter
    if (ratingFilter !== 'all') {
      query = query.eq('rating', parseInt(ratingFilter));
    }

    // Date filters
    if (dateFrom) {
      query = query.gte('created_at', format(dateFrom, 'yyyy-MM-dd'));
    }
    if (dateTo) {
      const endDate = new Date(dateTo);
      endDate.setDate(endDate.getDate() + 1);
      query = query.lt('created_at', format(endDate, 'yyyy-MM-dd'));
    }

    const { data, error } = await query;
    if (!error && data) {
      setReviews(data);
    }
    setLoading(false);
  };

  const toggleHidden = async (review: Review) => {
    setActionLoading(true);
    const { error } = await supabase
      .from('reviews')
      .update({ 
        is_hidden: !review.is_hidden,
        moderated_at: new Date().toISOString(),
      })
      .eq('id', review.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update review',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: review.is_hidden ? 'Review unhidden' : 'Review hidden',
      });
      fetchReviews();
    }
    setActionLoading(false);
  };

  const flagReview = async (review: Review) => {
    setActionLoading(true);
    const { error } = await supabase
      .from('reviews')
      .update({ 
        is_flagged: !review.is_flagged,
        flagged_reason: !review.is_flagged ? flagReason : null,
        moderated_at: new Date().toISOString(),
      })
      .eq('id', review.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to flag review',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: review.is_flagged ? 'Flag removed' : 'Review flagged',
      });
      setSelectedReview(null);
      setFlagReason('');
      fetchReviews();
    }
    setActionLoading(false);
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setReviewerTypeFilter('all');
    setRatingFilter('all');
    setDateFrom(undefined);
    setDateTo(undefined);
    setSearch('');
  };

  const hasActiveFilters = statusFilter !== 'all' || reviewerTypeFilter !== 'all' || ratingFilter !== 'all' || dateFrom || dateTo || search;

  const filteredReviews = reviews.filter(
    (r) =>
      r.content.toLowerCase().includes(search.toLowerCase()) ||
      r.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reviews Moderation</h1>
          <p className="text-muted-foreground">Moderate and manage platform reviews</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mt-4">
              {/* Search */}
              <div className="relative lg:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reviews..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Reviewer Type Filter */}
              <Select value={reviewerTypeFilter} onValueChange={(value: 'all' | 'worker' | 'business') => setReviewerTypeFilter(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Reviewer Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="worker">Finance Professional</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                </SelectContent>
              </Select>

              {/* Rating Filter */}
              <Select value={ratingFilter} onValueChange={setRatingFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ratings</SelectItem>
                  <SelectItem value="5">
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span>5 Stars</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="4">
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span>4 Stars</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="3">
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span>3 Stars</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="2">
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span>2 Stars</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="1">
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span>1 Star</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Date From */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, 'PP') : 'From Date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-background" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {/* Date To */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, 'PP') : 'To Date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-background" align="start">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Status Filters & Clear */}
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'flagged' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('flagged')}
              >
                Flagged
              </Button>
              <Button
                variant={statusFilter === 'hidden' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('hidden')}
              >
                Hidden
              </Button>
              
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="ml-auto text-muted-foreground"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear Filters
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rating</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReviews.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{review.rating}</span>
                      </div>
                    </TableCell>
                    <TableCell>{review.title || '-'}</TableCell>
                    <TableCell className="max-w-xs truncate">{review.content}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {review.reviewer_type === 'worker' ? 'Finance Professional' : 'Business'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {review.is_flagged && <Badge variant="destructive">Flagged</Badge>}
                        {review.is_hidden && <Badge variant="outline">Hidden</Badge>}
                        {!review.is_flagged && !review.is_hidden && <Badge className="bg-green-500">Active</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>{new Date(review.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleHidden(review)}
                          disabled={actionLoading}
                        >
                          {review.is_hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedReview(review)}
                        >
                          <Flag className={`h-4 w-4 ${review.is_flagged ? 'text-destructive' : ''}`} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredReviews.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No reviews found</p>
            )}
          </CardContent>
        </Card>

        <Dialog open={!!selectedReview} onOpenChange={(open) => !open && setSelectedReview(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedReview?.is_flagged ? 'Remove Flag' : 'Flag Review'}</DialogTitle>
              <DialogDescription>
                {selectedReview?.is_flagged 
                  ? 'Remove the flag from this review' 
                  : 'Flag this review for policy violation'}
              </DialogDescription>
            </DialogHeader>
            {selectedReview && (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="font-medium">{selectedReview.title || 'No title'}</p>
                  <p className="text-sm text-muted-foreground mt-1">{selectedReview.content}</p>
                </div>
                {!selectedReview.is_flagged && (
                  <div>
                    <p className="font-medium text-sm mb-2">Reason for flagging</p>
                    <Textarea
                      value={flagReason}
                      onChange={(e) => setFlagReason(e.target.value)}
                      placeholder="Enter reason..."
                    />
                  </div>
                )}
                <Button
                  onClick={() => flagReview(selectedReview)}
                  disabled={actionLoading || (!selectedReview.is_flagged && !flagReason.trim())}
                  variant={selectedReview.is_flagged ? 'default' : 'destructive'}
                  className="w-full"
                >
                  {selectedReview.is_flagged ? 'Remove Flag' : 'Flag Review'}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
