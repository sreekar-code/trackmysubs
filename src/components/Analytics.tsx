import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useCurrency } from '../contexts/CurrencyContext';
import { convertCurrency } from '../utils/currencyConverter';
import { BarChart, LineChart, PieChart, Calendar, Clock, LayoutDashboard } from 'lucide-react';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';
import { signOut } from '../lib/auth';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import DashboardHeader from './dashboard/DashboardHeader';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface Subscription {
  id: string;
  name: string;
  price: number;
  billing_cycle: string;
  next_billing: string;
  currency: string;
  category?: {
    name: string;
  };
}

type ViewType = 'graphs' | 'calendar' | 'timeline';

const Analytics: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<ViewType>('graphs');
  const { formatAmount, currency } = useCurrency();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const navigate = useNavigate();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0, showAbove: false, showLeft: false });
  const [convertedAmounts, setConvertedAmounts] = useState<{ [key: string]: number }>({});
  const [isConverting, setIsConverting] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const formatSubscriptionAmount = (amount: number, currency: string): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount);
  };

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        const { data, error } = await supabase
          .from('subscriptions')
          .select(`
            *,
            category:subscription_categories(name)
          `)
          .order('next_billing', { ascending: true });
        if (error) throw error;
        setSubscriptions(data?.map((subscription: any) => ({
          id: subscription.id,
          name: subscription.name,
          price: subscription.price,
          billing_cycle: subscription.billing_cycle,
          next_billing: subscription.next_billing,
          currency: subscription.currency || 'USD',
          category: subscription.category
        })) || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load subscriptions');
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptions();
  }, []);

  const calculateMonthlyPrice = async (price: number, billingCycle: string, fromCurrency: string): Promise<number> => {
    let monthlyPrice = price;
    switch (billingCycle) {
      case 'Yearly':
        monthlyPrice = price / 12;
        break;
      case 'Quarterly':
        monthlyPrice = price / 3;
        break;
    }
    
    try {
      const convertedPrice = await convertCurrency(monthlyPrice, fromCurrency, currency);
      return convertedPrice;
    } catch (error) {
      console.error('Error converting currency:', error);
      return monthlyPrice;
    }
  };

  const prepareCategoryData = async () => {
    setIsConverting(true);
    try {
      const categoryTotals: { [key: string]: number } = {};
      
      for (const sub of subscriptions) {
    const category = sub.category?.name || 'Uncategorized';
        const monthlyPrice = await calculateMonthlyPrice(
          sub.price,
          sub.billing_cycle,
          sub.currency
        );
        
        categoryTotals[category] = (categoryTotals[category] || 0) + monthlyPrice;
      }

      setConvertedAmounts(categoryTotals);
    } catch (error) {
      console.error('Error preparing category data:', error);
    } finally {
      setIsConverting(false);
    }
  };

  useEffect(() => {
    if (subscriptions.length > 0) {
      prepareCategoryData();
    }
  }, [subscriptions, currency]);

  const monthlySpendData = {
    labels: Object.keys(convertedAmounts),
    datasets: [
      {
        label: `Monthly Spend by Category (${currency})`,
        data: Object.values(convertedAmounts),
        backgroundColor: [
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 99, 132, 0.5)',
          'rgba(75, 192, 192, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(153, 102, 255, 0.5)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const calendarEvents = subscriptions.map(sub => ({
    title: sub.name,
    date: sub.next_billing,
    backgroundColor: '#E2E8F0',
    textColor: '#1E293B',
    extendedProps: {
      subscription: sub
    }
  }));

  const timelineEvents = [...subscriptions]
    .sort((a, b) => new Date(a.next_billing).getTime() - new Date(b.next_billing).getTime())
    .map(sub => ({
      ...sub,
      monthlyPrice: calculateMonthlyPrice(sub.price, sub.billing_cycle, sub.currency),
    }));

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const calculatePopupPosition = (rect: DOMRect): { top: number; left: number; showAbove: boolean; showLeft: boolean } => {
    const POPUP_WIDTH = 320;
    const POPUP_HEIGHT = 200;
    const MARGIN = 16;
    
    // Get calendar container dimensions
    const calendarContainer = document.querySelector('.fc-view-harness');
    if (!calendarContainer) return { top: 0, left: 0, showAbove: false, showLeft: false };
    
    const containerRect = calendarContainer.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;

    // Calculate available space in all directions
    const spaceAbove = rect.top - Math.max(containerRect.top, 0);
    const spaceBelow = Math.min(containerRect.bottom, viewportHeight) - rect.bottom;
    const spaceLeft = rect.left - Math.max(containerRect.left, 0);
    const spaceRight = Math.min(containerRect.right, viewportWidth) - rect.right;

    // Initialize position variables
    let top: number;
    let left: number;
    let showAbove: boolean;
    let showLeft: boolean;

    // Determine vertical position
    if (spaceBelow >= POPUP_HEIGHT || spaceBelow > spaceAbove) {
      // Show below if there's enough space or more space than above
      showAbove = false;
      top = rect.bottom + scrollY + MARGIN;
      
      // Ensure it doesn't go below viewport
      if (top + POPUP_HEIGHT > viewportHeight + scrollY) {
        top = viewportHeight + scrollY - POPUP_HEIGHT - MARGIN;
      }
    } else {
      // Show above
      showAbove = true;
      top = rect.top + scrollY - POPUP_HEIGHT - MARGIN;
      
      // Ensure it doesn't go above viewport
      if (top < scrollY) {
        top = scrollY + MARGIN;
      }
    }

    // Determine horizontal position
    if (spaceRight >= POPUP_WIDTH || spaceRight > spaceLeft) {
      // Show on right if there's enough space or more space than left
      showLeft = false;
      left = rect.left + scrollX;
      
      // Ensure it doesn't go beyond right edge
      if (left + POPUP_WIDTH > viewportWidth + scrollX) {
        left = viewportWidth + scrollX - POPUP_WIDTH - MARGIN;
      }
    } else {
      // Show on left
      showLeft = true;
      left = rect.right + scrollX - POPUP_WIDTH;
      
      // Ensure it doesn't go beyond left edge
      if (left < scrollX) {
        left = scrollX + MARGIN;
      }
    }

    // Additional adjustments for calendar container boundaries
    // Ensure popup stays within calendar container horizontally
    if (left < containerRect.left + scrollX) {
      left = containerRect.left + scrollX + MARGIN;
    } else if (left + POPUP_WIDTH > containerRect.right + scrollX) {
      left = containerRect.right + scrollX - POPUP_WIDTH - MARGIN;
    }

    // If popup would be cut off by top of viewport, show it below instead
    if (top < scrollY + MARGIN) {
      showAbove = false;
      top = rect.bottom + scrollY + MARGIN;
    }

    // If popup would be cut off by bottom of viewport, show it above instead
    if (top + POPUP_HEIGHT > viewportHeight + scrollY - MARGIN) {
      showAbove = true;
      top = rect.top + scrollY - POPUP_HEIGHT - MARGIN;
    }

    // Final position adjustments to ensure visibility
    top = Math.max(scrollY + MARGIN, Math.min(top, viewportHeight + scrollY - POPUP_HEIGHT - MARGIN));
    left = Math.max(scrollX + MARGIN, Math.min(left, viewportWidth + scrollX - POPUP_WIDTH - MARGIN));

    return { top, left, showAbove, showLeft };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader
        onAddNew={() => navigate('/')}
        onSignOut={handleSignOut}
        showMobileMenu={showMobileMenu}
        setShowMobileMenu={setShowMobileMenu}
        onManageCategories={() => navigate('/')}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {error && (
          <div className="bg-red-50 p-4 rounded-lg mb-4 sm:mb-6">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6 overflow-x-auto">
          <div className="flex gap-2 sm:gap-4 justify-start">
            <button
              onClick={() => setActiveView('graphs')}
              className={`flex items-center px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base ${
                activeView === 'graphs'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <BarChart className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
              <span className="whitespace-nowrap">Graphs</span>
            </button>
            <button
              onClick={() => setActiveView('calendar')}
              className={`flex items-center px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base ${
                activeView === 'calendar'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
              <span className="whitespace-nowrap">Calendar</span>
            </button>
            <button
              onClick={() => setActiveView('timeline')}
              className={`flex items-center px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base ${
                activeView === 'timeline'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
              <span className="whitespace-nowrap">Timeline</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          {activeView === 'graphs' && (
            <div className="space-y-6 sm:space-y-8">
              {isConverting ? (
                <div className="flex items-center justify-center h-[300px]">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <>
              <div>
                    <h3 className="text-base sm:text-lg font-semibold mb-4">
                      Monthly Spend by Category ({currency})
                    </h3>
                <div className="h-[300px] sm:h-[400px]">
                  <Bar
                    data={monthlySpendData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: isMobile ? 'bottom' : 'top',
                          labels: {
                            boxWidth: isMobile ? 12 : 40,
                            padding: isMobile ? 10 : 20,
                            font: {
                              size: isMobile ? 10 : 12
                            }
                          }
                        },
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              return `${context.label}: ${formatAmount(context.raw as number)}`;
                            }
                          }
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            callback: function(value) {
                              return formatAmount(value as number);
                            },
                            font: {
                              size: isMobile ? 10 : 12
                            }
                          }
                        },
                        x: {
                          ticks: {
                            font: {
                              size: isMobile ? 10 : 12
                            }
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold mb-4">Spend Distribution</h3>
                <div className="h-[300px] sm:h-[400px]">
                  <Pie
                    data={monthlySpendData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: isMobile ? 'bottom' : 'top',
                          labels: {
                            boxWidth: isMobile ? 12 : 40,
                            padding: isMobile ? 10 : 20,
                            font: {
                              size: isMobile ? 10 : 12
                            }
                          }
                        },
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              return `${context.label}: ${formatAmount(context.raw as number)}`;
                            }
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
                </>
              )}
            </div>
          )}

          {activeView === 'calendar' && (
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-4 text-gray-700">Subscription Calendar</h3>
              <div className="bg-white rounded-lg -mx-4 sm:mx-0 overflow-x-auto p-3 shadow-sm relative">
                <div className={`${isMobile ? 'text-sm' : 'text-base'}`}>
                <FullCalendar
                  plugins={[dayGridPlugin]}
                  initialView="dayGridMonth"
                  events={calendarEvents}
                  height="auto"
                  headerToolbar={{
                      left: 'prev,next',
                    center: 'title',
                    right: 'dayGridMonth'
                  }}
                  dayMaxEvents={isMobile ? 2 : true}
                    eventDisplay="block"
                  views={{
                    dayGridMonth: {
                        titleFormat: { 
                          year: 'numeric', 
                          month: isMobile ? 'short' : 'long'
                        },
                        dayHeaderFormat: { 
                          weekday: isMobile ? 'narrow' : 'short' 
                        },
                        eventMinHeight: isMobile ? 20 : 25,
                        eventShortHeight: isMobile ? 30 : 40,
                      }
                    }}
                    eventContent={(arg) => {
                      return (
                        <div 
                          className={`
                            p-2 rounded-md w-full
                            ${isMobile ? 'text-xs' : 'text-sm'} 
                            font-medium cursor-pointer hover:bg-gray-200 transition-colors
                          `}
                          onClick={(e) => {
                            e.stopPropagation();
                            const rect = e.currentTarget.getBoundingClientRect();
                            const position = calculatePopupPosition(rect);
                            
                            setPopupPosition({
                              top: position.top,
                              left: position.left,
                              showAbove: position.showAbove,
                              showLeft: position.showLeft
                            });
                            setSelectedSubscription(arg.event.extendedProps.subscription);
                          }}
                        >
                          <span className="truncate block">{arg.event.title}</span>
                        </div>
                      )
                    }}
                    dayHeaderClassNames="text-gray-600 font-medium py-2"
                    dayCellClassNames="text-gray-700 hover:bg-gray-50"
                    eventClassNames="shadow-sm hover:shadow transition-shadow"
                    contentHeight={isMobile ? "auto" : 600}
                    handleWindowResize={true}
                    stickyHeaderDates={true}
                  />
                </div>

                {/* Subscription Details Popup */}
                {selectedSubscription && (
                  <>
                    <div 
                      className="fixed inset-0 z-40 bg-gray-500/20 backdrop-blur-sm" 
                      onClick={() => setSelectedSubscription(null)}
                    />
                    <div
                      className={`
                        fixed z-50 bg-white/95 rounded-lg shadow-lg
                        ${isMobile ? 'w-[280px] p-4' : 'w-[320px] p-5'}
                        transition-all duration-200 ease-out
                      `}
                      style={{
                        top: `${popupPosition.top}px`,
                        left: `${popupPosition.left}px`,
                        transform: `translate3d(0, 0, 0)`,
                        opacity: selectedSubscription ? 1 : 0,
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
                      }}
                    >
                      <div className="flex flex-col space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className={`font-semibold text-gray-900 ${isMobile ? 'text-sm' : 'text-base'}`}>
                            {selectedSubscription.name}
                          </h4>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSubscription(null);
                            }}
                            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                          >
                            ×
                          </button>
                        </div>
                        <div className="h-px bg-gray-200" />
                        <div className={`space-y-3 ${isMobile ? 'text-sm' : 'text-base'}`}>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500">Price</span>
                            <span className="font-medium text-gray-900">
                              {formatSubscriptionAmount(selectedSubscription.price, selectedSubscription.currency)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500">Category</span>
                            <span className="font-medium text-gray-900">
                              {selectedSubscription.category?.name || 'Uncategorized'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500">Billing Cycle</span>
                            <span className="font-medium text-gray-900">
                              {selectedSubscription.billing_cycle}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500">Next Billing</span>
                            <span className="font-medium text-gray-900">
                              {new Date(selectedSubscription.next_billing).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {activeView === 'timeline' && (
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-4">Subscription Timeline</h3>
              <div className="space-y-3 sm:space-y-4">
                {timelineEvents.map((event, index) => (
                  <div
                    key={event.id}
                    className="relative flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4"
                  >
                    <div className="flex items-center">
                      <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-blue-100 flex-shrink-0">
                        <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                      </div>
                      <span className="ml-2 sm:ml-4 text-xs sm:text-sm text-gray-500">
                        {new Date(event.next_billing).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex-grow bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">{event.name}</h4>
                          <p className="text-xs sm:text-sm text-gray-500">
                            {event.category?.name || 'Uncategorized'}
                          </p>
                        </div>
                        <div className="flex justify-between sm:text-right items-center sm:block">
                          <p className="text-sm font-medium text-gray-900">
                            {formatSubscriptionAmount(event.price, event.currency)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {event.billing_cycle}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Analytics;