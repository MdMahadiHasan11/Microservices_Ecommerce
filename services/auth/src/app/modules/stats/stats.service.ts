/* eslint-disable @typescript-eslint/no-explicit-any */
import { Booking } from "../booking/booking.model";
import { PAYMENT_STATUS } from "../payment/payment.interface";
import { Payment } from "../payment/payment.model";
import { isActive } from "../user/user.interface";
// import { IsActive } from "../user/user.interface";
import { User } from "../user/user.model";

const now = new Date();
const sevenDaysAgo = new Date(now).setDate(now.getDate() - 7);
const thirtyDaysAgo = new Date(now).setDate(now.getDate() - 30);

const getUserStats = async () => {
  const totalUsersPromise = User.countDocuments();

  const totalActiveUsersPromise = User.countDocuments({
    isActive: isActive.ACTIVE,
  });
  const totalInActiveUsersPromise = User.countDocuments({
    isActive: isActive.INACTIVE,
  });
  const totalBlockedUsersPromise = User.countDocuments({
    isActive: isActive.BLOCKED,
  });

  const newUsersInLast7DaysPromise = User.countDocuments({
    createdAt: { $gte: sevenDaysAgo },
  });
  const newUsersInLast30DaysPromise = User.countDocuments({
    createdAt: { $gte: thirtyDaysAgo },
  });

  const usersByRolePromise = User.aggregate([
    //stage -1 : Grouping users by role and count total users in each role

    {
      $group: {
        _id: "$role",
        count: { $sum: 1 },
      },
    },
  ]);

  const [
    totalUsers,
    totalActiveUsers,
    totalInActiveUsers,
    totalBlockedUsers,
    newUsersInLast7Days,
    newUsersInLast30Days,
    usersByRole,
  ] = await Promise.all([
    totalUsersPromise,
    totalActiveUsersPromise,
    totalInActiveUsersPromise,
    totalBlockedUsersPromise,
    newUsersInLast7DaysPromise,
    newUsersInLast30DaysPromise,
    usersByRolePromise,
  ]);
  return {
    totalUsers,
    totalActiveUsers,
    totalInActiveUsers,
    totalBlockedUsers,
    newUsersInLast7Days,
    newUsersInLast30Days,
    usersByRole,
  };
};

const getBookingStats = async () => {
  const totalBookingPromise = Booking.countDocuments();

  const totalBookingByStatusPromise = Booking.aggregate([
    //stage-1 group stage
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const bookingsPerTourPromise = Booking.aggregate([
    {
      $group: {
        _id: "$tour",
        bookingCount: { $sum: 1 },
      },
    },
    {
      $sort: { bookingCount: -1 },
    },
    {
      $limit: 10,
    },

    //here tour booking count is calculated and another data model collection setup
    {
      $lookup: {
        from: "tours",
        localField: "_id",
        foreignField: "_id",
        as: "tour",
      },
    },

    {
      $unwind: "$tour",
    },
    {
      $project: {
        bookingCount: 1,
        _id: 1,
        "tour.title": 1,
        "tour.slug": 1,
      },
    },
  ]);

  const avgGuestCountPerBookingPromise = Booking.aggregate([
    // stage 1  - group stage
    {
      $group: {
        _id: null,
        avgGuestCount: { $avg: "$guestCount" },
      },
    },
  ]);

  const bookingsLast7DaysPromise = Booking.countDocuments({
    createdAt: { $gte: sevenDaysAgo },
  });
  const bookingsLast30DaysPromise = Booking.countDocuments({
    createdAt: { $gte: thirtyDaysAgo },
  });

  const totalBookingByUniqueUsersPromise = Booking.distinct("user").then(
    (user: any) => user.length
  );

  const [
    totalBooking,
    totalBookingByStatus,
    bookingsPerTour,
    avgGuestCountPerBooking,
    bookingsLast7Days,
    bookingsLast30Days,
    totalBookingByUniqueUsers,
  ] = await Promise.all([
    totalBookingPromise,
    totalBookingByStatusPromise,
    bookingsPerTourPromise,
    avgGuestCountPerBookingPromise,
    bookingsLast7DaysPromise,
    bookingsLast30DaysPromise,
    totalBookingByStatusPromise,
    totalBookingByUniqueUsersPromise,
  ]);

  return {
    totalBooking,
    totalBookingByStatus,
    bookingsPerTour,
    avgGuestCountPerBooking: avgGuestCountPerBooking[0].avgGuestCount,
    bookingsLast7Days,
    bookingsLast30Days,
    totalBookingByUniqueUsers,
  };
};

const getPaymentStats = async () => {
  const totalPaymentPromise = Payment.countDocuments();

  const totalPaymentByStatusPromise = Payment.aggregate([
    //stage 1 group
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const totalRevenuePromise = Payment.aggregate([
    //stage1 match stage
    {
      $match: { status: PAYMENT_STATUS.PAID },
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$amount" },
      },
    },
  ]);

  const avgPaymentAmountPromise = Payment.aggregate([
    //stage 1 group stage
    {
      $group: {
        _id: null,
        avgPaymentAMount: { $avg: "$amount" },
      },
    },
  ]);

  const paymentGatewayDataPromise = Payment.aggregate([
    //stage 1 group stage
    {
      $group: {
        _id: { $ifNull: ["$paymentGatewayData.status", "UNKNOWN"] },
        count: { $sum: 1 },
      },
    },
  ]);

  const [
    totalPayment,
    totalPaymentByStatus,
    totalRevenue,
    avgPaymentAmount,
    paymentGatewayData,
  ] = await Promise.all([
    totalPaymentPromise,
    totalPaymentByStatusPromise,
    totalRevenuePromise,
    avgPaymentAmountPromise,
    paymentGatewayDataPromise,
  ]);
  return {
    totalPayment,
    totalPaymentByStatus,
    totalRevenue,
    avgPaymentAmount,
    paymentGatewayData,
  };
};

export const StatsService = {
  getBookingStats,
  getPaymentStats,
  getUserStats,
};
