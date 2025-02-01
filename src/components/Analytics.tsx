import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useCurrency } from '../contexts/CurrencyContext';
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

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const calculateMonthlyPrice = (price: number, billingCycle: string): number => {
    switch (billingCycle) {
      case 'Yearly':
        return price / 12;
      case 'Quarterly':
        return price / 3;
      default:
        return price;
    }
  };

  // Prepare data for charts
  const categoryData = subscriptions.reduce((acc: { [key: string]: number }, sub) => {
    const category = sub.category?.name || 'Uncategorized';
    const monthlyPrice = calculateMonthlyPrice(sub.price, sub.billing_cycle);
    acc[category] = (acc[category] || 0) + monthlyPrice;
    return acc;
  }, {});

  const monthlySpendData = {
    labels: Object.keys(categoryData),
    datasets: [
      {
        label: 'Monthly Spend by Category',
        data: Object.values(categoryData),
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
    backgroundColor: sub.category?.name === 'Streaming' ? '#3B82F6' :
                    sub.category?.name === 'Software' ? '#EF4444' :
                    '#10B981',
  }));

  const timelineEvents = [...subscriptions]
    .sort((a, b) => new Date(a.next_billing).getTime() - new Date(b.next_billing).getTime())
    .map(sub => ({
      ...sub,
      monthlyPrice: calculateMonthlyPrice(sub.price, sub.billing_cycle),
    }));

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
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
              <div>
                <h3 className="text-base sm:text-lg font-semibold mb-4">Monthly Spend by Category</h3>
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
            </div>
          )}

          {activeView === 'calendar' && (
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-4">Subscription Calendar</h3>
              <div className="bg-gray-50 rounded-lg -mx-4 sm:mx-0 overflow-x-auto p-3 shadow">
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
                            text-white font-semibold
                          `}
                        >
                          <span className="truncate block">{arg.event.title}</span>
                        </div>
                      )
                    }}
                    dayHeaderClassNames={isMobile ? 'text-xs py-1' : 'py-2'}
                    dayCellClassNames={isMobile ? 'text-xs' : 'text-sm'}
                    eventClassNames="rounded-md shadow-sm"
                    contentHeight={isMobile ? "auto" : 600}
                    handleWindowResize={true}
                    stickyHeaderDates={true}
                  />
                </div>
              </div>
            </div>
          )}

          {activeView === 'timeline' && (
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-4">Upcoming Renewals</h3>
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
                            {formatAmount(event.price)}
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